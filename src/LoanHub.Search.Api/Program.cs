using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Banks;
using LoanHub.Search.Core.Abstractions.Auth;
using LoanHub.Search.Core.Abstractions.Auditing;
using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Abstractions.Selections;
using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Services;
using LoanHub.Search.Core.Services.Applications;
using LoanHub.Search.Core.Services.Auditing;
using LoanHub.Search.Core.Services.Auth;
using LoanHub.Search.Core.Services.Banks;
using LoanHub.Search.Core.Services.Notifications;
using LoanHub.Search.Core.Services.Selections;
using LoanHub.Search.Core.Services.Users;
using LoanHub.Search.Core.Models.Notifications;
using LoanHub.Search.Api.Notifications;
using LoanHub.Search.Api.Authorization;
using LoanHub.Search.Api.Middleware;
using LoanHub.Search.Api.Options;
using LoanHub.Search.Api.Services;
using LoanHub.Search.Infrastructure;
using LoanHub.Search.Infrastructure.Providers;
using LoanHub.Search.Infrastructure.Repositories;
using LoanHub.Search.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using LoanHub.Search.Core.Models.Users;
using System.IO;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.PostgreSQL;

LoadEnvironmentFileIfPresent(".env", onlyIfMissing: true);
if (IsDevelopmentEnvironment())
{
    LoadEnvironmentFileIfPresent(".env.example", onlyIfMissing: true);
}

var builder = WebApplication.CreateBuilder(args);

var auditOptions = builder.Configuration.GetSection("Audit").Get<AuditOptions>() ?? new AuditOptions();
builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    var connectionString = context.Configuration.GetConnectionString("Applications") ?? string.Empty;

    loggerConfiguration
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .WriteTo.Console();

    if (auditOptions.Enabled && !string.IsNullOrWhiteSpace(connectionString))
    {
        var columnWriters = new Dictionary<string, ColumnWriterBase>
        {
            ["message"] = new RenderedMessageColumnWriter(),
            ["message_template"] = new MessageTemplateColumnWriter(),
            ["level"] = new LevelColumnWriter(),
            ["logged_at"] = new TimestampColumnWriter(),
            ["exception"] = new ExceptionColumnWriter(),
            ["properties"] = new PropertiesColumnWriter(),
            ["log_event"] = new LogEventSerializedColumnWriter(),
            ["request_method"] = new SinglePropertyColumnWriter("RequestMethod"),
            ["request_path"] = new SinglePropertyColumnWriter("RequestPath"),
            ["query_string"] = new SinglePropertyColumnWriter("QueryString"),
            ["status_code"] = new SinglePropertyColumnWriter("StatusCode"),
            ["elapsed_ms"] = new SinglePropertyColumnWriter("ElapsedMs"),
            ["request_headers"] = new SinglePropertyColumnWriter("RequestHeaders"),
            ["response_headers"] = new SinglePropertyColumnWriter("ResponseHeaders"),
            ["request_body"] = new SinglePropertyColumnWriter("RequestBody"),
            ["response_body"] = new SinglePropertyColumnWriter("ResponseBody"),
            ["user_id"] = new SinglePropertyColumnWriter("UserId"),
            ["user_email"] = new SinglePropertyColumnWriter("UserEmail"),
            ["client_ip"] = new SinglePropertyColumnWriter("ClientIp"),
            ["user_agent"] = new SinglePropertyColumnWriter("UserAgent"),
            ["trace_id"] = new SinglePropertyColumnWriter("TraceId")
        };

        loggerConfiguration.WriteTo.Logger(logger =>
            logger.Filter.ByIncludingOnly(evt => evt.Properties.ContainsKey("IsAudit"))
                .WriteTo.PostgreSQL(
                    connectionString,
                    "audit_logs",
                    columnWriters,
                    needAutoCreateTable: true));
    }
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<OidcOptions>(builder.Configuration.GetSection("Oidc"));
builder.Services.Configure<GoogleOAuthOptions>(builder.Configuration.GetSection("GoogleOAuth"));
builder.Services.Configure<SendGridOptions>(builder.Configuration.GetSection("SendGrid"));
builder.Services.Configure<ProviderContactOptions>(builder.Configuration.GetSection("ProviderContacts"));
builder.Services.Configure<ContractStorageOptions>(builder.Configuration.GetSection("ContractStorage"));
builder.Services.Configure<ContractLinkOptions>(builder.Configuration.GetSection("ContractLinks"));
builder.Services.Configure<AuditOptions>(builder.Configuration.GetSection("Audit"));
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services.AddHttpClient();
builder.Services.PostConfigure<GoogleOAuthOptions>(options =>
{
    if (string.IsNullOrWhiteSpace(options.ClientId))
        options.ClientId = builder.Configuration["CLIENT_ID"] ?? options.ClientId;
    if (string.IsNullOrWhiteSpace(options.ClientSecret))
        options.ClientSecret = builder.Configuration["CLIENT_SECRET"] ?? options.ClientSecret;
});
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "Bearer";
        options.DefaultChallengeScheme = "Bearer";
    })
    .AddPolicyScheme("Bearer", "Bearer", options =>
    {
        var oidcOptions = builder.Configuration.GetSection("Oidc").Get<OidcOptions>() ?? new OidcOptions();
        options.ForwardDefaultSelector = context =>
        {
            var authorization = context.Request.Headers.Authorization.ToString();
            if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authorization["Bearer ".Length..].Trim();
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwt = handler.ReadJwtToken(token);
                    var issuer = jwt.Issuer ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(oidcOptions.Authority) &&
                        issuer.StartsWith(oidcOptions.Authority.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
                    {
                        return "Oidc";
                    }
                }
            }

            return "LocalJwt";
        };
    })
    .AddJwtBearer("LocalJwt", options =>
    {
        var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1),
            RoleClaimType = "role"
        };
    })
    .AddJwtBearer("Oidc", options =>
    {
        var oidcOptions = builder.Configuration.GetSection("Oidc").Get<OidcOptions>() ?? new OidcOptions();
        options.Authority = oidcOptions.Authority;
        options.Audience = oidcOptions.Audience;
        options.RequireHttpsMetadata = oidcOptions.RequireHttpsMetadata;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            RoleClaimType = "roles"
        };
        if (oidcOptions.ValidIssuers.Length > 0)
        {
            options.TokenValidationParameters.ValidIssuers = oidcOptions.ValidIssuers;
        }
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireAuthenticatedUser()
            .AddRequirements(new AdminAccessRequirement()));
    
    options.AddPolicy("UserOnly", policy =>
        policy.RequireAuthenticatedUser()
            .AddRequirements(new UserOnlyRequirement()));
    
    options.AddPolicy("NotAdmin", policy =>
        policy.AddRequirements(new NotAdminRequirement()));

    options.AddPolicy("PlatformAdminOnly", policy =>
        policy.RequireAuthenticatedUser()
            .AddRequirements(new PlatformAdminRequirement()));
});
builder.Services.AddScoped<IAuthorizationHandler, AdminAccessHandler>();
builder.Services.AddScoped<IAuthorizationHandler, UserOnlyHandler>();
builder.Services.AddScoped<IAuthorizationHandler, NotAdminHandler>();
builder.Services.AddScoped<IAuthorizationHandler, PlatformAdminHandler>();

builder.Services.AddScoped<ILoanOfferProviderRegistry, BankApiOfferProviderRegistry>();
builder.Services.AddScoped<OffersAggregator>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Applications")));
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<ApplicationService>();
builder.Services.AddScoped<IBankApiClientRepository, BankApiClientRepository>();
builder.Services.AddScoped<BankApiKeyService>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddHostedService<AuditRetentionService>();

// Contract storage configuration (for signed contracts)
builder.Services.Configure<ContractStorageOptions>(builder.Configuration.GetSection("ContractStorage"));
var contractStorageOptions = builder.Configuration.GetSection("ContractStorage").Get<ContractStorageOptions>() ?? new ContractStorageOptions();
if (string.IsNullOrWhiteSpace(contractStorageOptions.ConnectionString))
{
    builder.Services.AddSingleton<IContractStorage, LocalFileContractStorage>();
}
else
{
    builder.Services.AddSingleton<IContractStorage, AzureBlobContractStorage>();
}

// Document storage configuration (for ID documents, proof of income, etc.)
builder.Services.Configure<DocumentStorageOptions>(builder.Configuration.GetSection("DocumentStorage"));
var documentStorageOptions = builder.Configuration.GetSection("DocumentStorage").Get<DocumentStorageOptions>() ?? new DocumentStorageOptions();
if (string.IsNullOrWhiteSpace(documentStorageOptions.ConnectionString))
{
    builder.Services.AddSingleton<IDocumentStorage, LocalFileDocumentStorage>();
}
else
{
    builder.Services.AddSingleton<IDocumentStorage, AzureBlobDocumentStorage>();
}

builder.Services.AddScoped<IOfferSelectionRepository, OfferSelectionRepository>();
builder.Services.AddScoped<OfferSelectionService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IBankRepository, BankRepository>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IExternalTokenValidator, OidcTokenValidator>();
builder.Services.AddScoped<IGoogleOAuthService, GoogleOAuthService>();
builder.Services.AddScoped<IProviderContactResolver, ProviderContactResolver>();
builder.Services.AddSingleton<IRealtimeNotifier, SignalRApplicationNotifier>();
builder.Services.AddSingleton<IEmailTemplateRenderer, EmailTemplateRenderer>();
builder.Services.AddSingleton<IContractLinkGenerator, ContractLinkGenerator>();
builder.Services.AddSingleton<IContractDocumentGenerator, ContractDocumentGenerator>();
builder.Services.Configure<EmailBrandingOptions>(builder.Configuration.GetSection("EmailBranding"));
builder.Services.Configure<PlatformAdminOptions>(builder.Configuration.GetSection("PlatformAdmins"));
builder.Services.AddScoped<PlatformAdminAuthService>();
var contentRoot = builder.Environment.ContentRootPath;
builder.Services.PostConfigure<EmailBrandingOptions>(options =>
{
    if (!string.IsNullOrWhiteSpace(options.LogoInlineBase64) || string.IsNullOrWhiteSpace(options.LogoPath))
        return;

    var candidates = new[]
    {
        options.LogoPath,
        Path.Combine(contentRoot, options.LogoPath),
        Path.GetFullPath(options.LogoPath)
    };

    var resolvedPath = string.Empty;
    foreach (var path in candidates)
    {
        if (File.Exists(path))
        {
            resolvedPath = path;
            break;
        }
    }

    if (string.IsNullOrWhiteSpace(resolvedPath))
    {
        var current = new DirectoryInfo(contentRoot);
        while (current is not null && string.IsNullOrWhiteSpace(resolvedPath))
        {
            var fallbackPath = Path.Combine(current.FullName, "src", "LoanHub.Search.Web", "public", "LoanHub_logo.png");
            if (File.Exists(fallbackPath))
                resolvedPath = fallbackPath;

            current = current.Parent;
        }
    }

    if (string.IsNullOrWhiteSpace(resolvedPath))
        return;

    try
    {
        using var image = Image.Load(resolvedPath);
        var maxWidth = options.LogoInlineMaxWidth > 0 ? options.LogoInlineMaxWidth : image.Width;
        var maxHeight = options.LogoInlineMaxHeight > 0 ? options.LogoInlineMaxHeight : image.Height;
        if (image.Width > maxWidth || image.Height > maxHeight)
        {
            var widthRatio = (double)maxWidth / image.Width;
            var heightRatio = (double)maxHeight / image.Height;
            var ratio = maxHeight == 0 ? widthRatio : Math.Min(widthRatio, heightRatio);
            var newWidth = Math.Max(1, (int)Math.Round(image.Width * ratio));
            var newHeight = Math.Max(1, (int)Math.Round(image.Height * ratio));
            image.Mutate(ctx => ctx.Resize(newWidth, newHeight));
        }

        using var stream = new MemoryStream();
        var encoder = new PngEncoder { CompressionLevel = PngCompressionLevel.BestCompression };
        image.Save(stream, encoder);
        options.LogoInlineBase64 = Convert.ToBase64String(stream.ToArray());
        if (string.IsNullOrWhiteSpace(options.LogoInlineContentType))
            options.LogoInlineContentType = "image/png";
    }
    catch
    {
        var bytes = File.ReadAllBytes(resolvedPath);
        options.LogoInlineBase64 = Convert.ToBase64String(bytes);
        if (string.IsNullOrWhiteSpace(options.LogoInlineContentType))
            options.LogoInlineContentType = "image/png";
    }
});

var sendGridOptions = builder.Configuration.GetSection("SendGrid").Get<SendGridOptions>() ?? new SendGridOptions();
var useSendGrid = !string.IsNullOrWhiteSpace(sendGridOptions.ApiKey) &&
    !string.IsNullOrWhiteSpace(sendGridOptions.FromEmail);
if (!useSendGrid)
{
    builder.Services.AddSingleton<IEmailSender, NullEmailSender>();
}
else
{
    builder.Services.AddSingleton<IEmailSender, SendGridEmailSender>();
}

var app = builder.Build();

app.Logger.LogInformation(
    "Email sender configured: {EmailSender}",
    useSendGrid ? "SendGrid" : "Disabled (NullEmailSender)");
if (!useSendGrid)
{
    app.Logger.LogInformation("Set SendGrid__ApiKey and SendGrid__FromEmail to enable outgoing email.");
}

await InitializeDatabaseAsync(app);

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseMiddleware<AuditLoggingMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ApplicationsHub>("/hubs/applications");

app.Run();

static async Task InitializeDatabaseAsync(WebApplication app)
{
    const int maxAttempts = 10;
    var retryDelay = TimeSpan.FromSeconds(2);

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            await dbContext.Database.EnsureCreatedAsync(CancellationToken.None);
            var databaseCreator = dbContext.Database.GetService<IRelationalDatabaseCreator>();
            if (!databaseCreator.HasTables())
            {
                await dbContext.Database.EnsureDeletedAsync(CancellationToken.None);
                await dbContext.Database.EnsureCreatedAsync(CancellationToken.None);
            }

            await dbContext.Database.ExecuteSqlRawAsync("""
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "RejectReason" text;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "UserId" uuid;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "BankId" uuid;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "AssignedAdminId" uuid;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_Provider" varchar(120);
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_ProviderOfferId" varchar(120);
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_Installment" numeric;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_Apr" numeric;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_TotalCost" numeric;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_Amount" numeric;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_DurationMonths" integer;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "OfferSnapshot_ValidUntil" timestamptz;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "ApplicantDetails_MonthlyIncome" numeric;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "ApplicantDetails_LivingCosts" numeric;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "ApplicantDetails_Dependents" integer;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "ApplicantDetails_Phone" varchar(40);
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "ApplicantDetails_DateOfBirth" timestamptz;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "ContractReadyAt" timestamptz;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "SignedContractFileName" varchar(240);
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "SignedContractBlobName" varchar(320);
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "SignedContractContentType" varchar(160);
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "SignedContractReceivedAt" timestamptz;
                ALTER TABLE "Applications" ADD COLUMN IF NOT EXISTS "FinalApprovedAt" timestamptz;
                """, CancellationToken.None);
            await dbContext.Database.ExecuteSqlRawAsync("""
                UPDATE "Applications"
                SET "OfferSnapshot_ValidUntil" = COALESCE("OfferSnapshot_ValidUntil", "CreatedAt", NOW()) + INTERVAL '7 days'
                WHERE "OfferSnapshot_ValidUntil" IS NULL;
                """, CancellationToken.None);
            await dbContext.Database.ExecuteSqlRawAsync("""
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Phone" varchar(40);
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "DateOfBirth" timestamptz;
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "MonthlyIncome" numeric;
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "LivingCosts" numeric;
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Dependents" integer;
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "BankName" varchar(200);
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "BankApiEndpoint" varchar(500);
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "BankApiKey" varchar(500);
                """, CancellationToken.None);

            await dbContext.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS "Banks" (
                    "Id" uuid NOT NULL,
                    "Name" varchar(200) NOT NULL,
                    "ApiBaseUrl" varchar(500) NOT NULL,
                    "ApiKey" varchar(500),
                    "CreatedByUserId" uuid,
                    "CreatedAt" timestamptz NOT NULL,
                    "UpdatedAt" timestamptz NOT NULL,
                    CONSTRAINT "PK_Banks" PRIMARY KEY ("Id")
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Banks_Name" ON "Banks" ("Name");
                """, CancellationToken.None);

            await dbContext.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS "BankAdmins" (
                    "Id" uuid NOT NULL,
                    "BankId" uuid NOT NULL,
                    "UserAccountId" uuid NOT NULL,
                    "AssignedAt" timestamptz NOT NULL,
                    CONSTRAINT "PK_BankAdmins" PRIMARY KEY ("Id")
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_BankAdmins_BankId_UserAccountId" ON "BankAdmins" ("BankId", "UserAccountId");
                """, CancellationToken.None);

            await dbContext.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS "BankApiClients" (
                    "Id" uuid NOT NULL,
                    "Name" varchar(200) NOT NULL,
                    "KeyHash" varchar(128) NOT NULL,
                    "IsActive" boolean NOT NULL,
                    "CreatedByUserId" uuid,
                    "CreatedAt" timestamptz NOT NULL,
                    "LastUsedAt" timestamptz,
                    CONSTRAINT "PK_BankApiClients" PRIMARY KEY ("Id")
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_BankApiClients_KeyHash" ON "BankApiClients" ("KeyHash");
                CREATE INDEX IF NOT EXISTS "IX_BankApiClients_Name" ON "BankApiClients" ("Name");
                """, CancellationToken.None);

            await dbContext.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id bigserial PRIMARY KEY,
                    message text,
                    message_template text,
                    level varchar(20),
                    logged_at timestamptz NOT NULL,
                    exception text,
                    properties jsonb,
                    log_event jsonb,
                    request_method text,
                    request_path text,
                    query_string text,
                    status_code integer,
                    elapsed_ms integer,
                    request_headers jsonb,
                    response_headers jsonb,
                    request_body text,
                    response_body text,
                    user_id text,
                    user_email text,
                    client_ip text,
                    user_agent text,
                    trace_id text
                );
                CREATE INDEX IF NOT EXISTS ix_audit_logs_logged_at ON audit_logs (logged_at DESC);
                """, CancellationToken.None);

            app.Logger.LogInformation("Database initialized.");
            await BackfillBanksAsync(dbContext, CancellationToken.None);
            return;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            app.Logger.LogWarning(
                ex,
                "Database initialization failed (attempt {Attempt}/{MaxAttempts}). Retrying in {DelaySeconds}s...",
                attempt,
                maxAttempts,
                retryDelay.TotalSeconds);
            await Task.Delay(retryDelay);
        }
    }
}

static async Task BackfillBanksAsync(ApplicationDbContext dbContext, CancellationToken ct)
{
    var legacyAdmins = await dbContext.Users
        .AsNoTracking()
        .Where(user => user.Role == UserRole.Admin &&
            user.BankName != null &&
            user.BankApiEndpoint != null)
        .Select(user => new
        {
            user.Id,
            user.BankName,
            user.BankApiEndpoint,
            user.BankApiKey
        })
        .ToListAsync(ct);

    foreach (var admin in legacyAdmins)
    {
        var bankName = admin.BankName?.Trim();
        if (string.IsNullOrWhiteSpace(bankName))
            continue;

        var baseUrl = BankApiDescriptorParser.ExtractBaseUrl(admin.BankApiEndpoint);
        if (string.IsNullOrWhiteSpace(baseUrl))
            continue;

        var apiKey = BankApiDescriptorParser.NormalizeApiKey(
            BankApiDescriptorParser.ExtractApiKey(admin.BankApiKey));

        var bank = await dbContext.Banks
            .FirstOrDefaultAsync(current => EF.Functions.ILike(current.Name, bankName), ct);

        if (bank is null)
        {
            bank = new LoanHub.Search.Core.Models.Banks.Bank
            {
                Name = bankName,
                ApiBaseUrl = baseUrl,
                ApiKey = apiKey,
                CreatedByUserId = admin.Id,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            dbContext.Banks.Add(bank);
            await dbContext.SaveChangesAsync(ct);
        }
        else
        {
            var updated = false;
            if (string.IsNullOrWhiteSpace(bank.ApiBaseUrl) && !string.IsNullOrWhiteSpace(baseUrl))
            {
                bank.ApiBaseUrl = baseUrl;
                updated = true;
            }

            if (string.IsNullOrWhiteSpace(bank.ApiKey) && !string.IsNullOrWhiteSpace(apiKey))
            {
                bank.ApiKey = apiKey;
                updated = true;
            }

            if (updated)
            {
                bank.UpdatedAt = DateTimeOffset.UtcNow;
                await dbContext.SaveChangesAsync(ct);
            }
        }

        var adminExists = await dbContext.BankAdmins
            .AnyAsync(current => current.BankId == bank.Id && current.UserAccountId == admin.Id, ct);
        if (!adminExists)
        {
            dbContext.BankAdmins.Add(new LoanHub.Search.Core.Models.Banks.BankAdmin
            {
                BankId = bank.Id,
                UserAccountId = admin.Id,
                AssignedAt = DateTimeOffset.UtcNow
            });
            await dbContext.SaveChangesAsync(ct);
        }
    }

    var bankLookup = await dbContext.Banks
        .AsNoTracking()
        .Select(bank => new { bank.Id, bank.Name })
        .ToListAsync(ct);

    var applications = await dbContext.Applications
        .Where(app => app.BankId == null)
        .ToListAsync(ct);

    foreach (var application in applications)
    {
        if (string.IsNullOrWhiteSpace(application.OfferSnapshot.Provider))
            continue;

        var match = bankLookup.FirstOrDefault(bank =>
            bank.Name.Equals(application.OfferSnapshot.Provider, StringComparison.OrdinalIgnoreCase));
        if (match is null)
            continue;

        application.BankId = match.Id;
        application.UpdatedAt = DateTimeOffset.UtcNow;
    }

    if (applications.Count > 0)
        await dbContext.SaveChangesAsync(ct);
}

static bool IsDevelopmentEnvironment()
{
    var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
    return string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);
}

static void LoadEnvironmentFileIfPresent(string fileName, bool onlyIfMissing)
{
    var path = FindEnvFile(fileName);
    if (string.IsNullOrWhiteSpace(path))
        return;

    foreach (var rawLine in File.ReadAllLines(path))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            continue;

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0)
            continue;

        var key = line[..separatorIndex].Trim();
        if (string.IsNullOrWhiteSpace(key))
            continue;

        if (onlyIfMissing && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            continue;

        var value = line[(separatorIndex + 1)..].Trim();
        if (value.Length >= 2 && ((value.StartsWith('"') && value.EndsWith('"')) || (value.StartsWith('\'') && value.EndsWith('\''))))
        {
            value = value[1..^1];
        }

        Environment.SetEnvironmentVariable(key, value);
    }
}

static string? FindEnvFile(string fileName)
{
    var current = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (current is not null)
    {
        var candidate = Path.Combine(current.FullName, fileName);
        if (File.Exists(candidate))
            return candidate;

        current = current.Parent;
    }

    return null;
}
