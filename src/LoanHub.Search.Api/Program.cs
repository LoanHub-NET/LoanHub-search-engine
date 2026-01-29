using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Auth;
using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Abstractions.Selections;
using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Services;
using LoanHub.Search.Core.Services.Applications;
using LoanHub.Search.Core.Services.Auth;
using LoanHub.Search.Core.Services.Notifications;
using LoanHub.Search.Core.Services.Selections;
using LoanHub.Search.Core.Services.Users;
using LoanHub.Search.Core.Models.Notifications;
using LoanHub.Search.Api.Notifications;
using LoanHub.Search.Api.Authorization;
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

var builder = WebApplication.CreateBuilder(args);

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
});
builder.Services.AddScoped<IAuthorizationHandler, AdminAccessHandler>();
builder.Services.AddScoped<IAuthorizationHandler, UserOnlyHandler>();
builder.Services.AddScoped<IAuthorizationHandler, NotAdminHandler>();

builder.Services.AddScoped<ILoanOfferProviderRegistry, BankApiOfferProviderRegistry>();
builder.Services.AddScoped<OffersAggregator>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Applications")));
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<ApplicationService>();

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
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IExternalTokenValidator, OidcTokenValidator>();
builder.Services.AddScoped<IGoogleOAuthService, GoogleOAuthService>();
builder.Services.AddScoped<IProviderContactResolver, ProviderContactResolver>();
builder.Services.AddSingleton<IRealtimeNotifier, SignalRApplicationNotifier>();
builder.Services.AddSingleton<IEmailTemplateRenderer, EmailTemplateRenderer>();
builder.Services.AddSingleton<IContractLinkGenerator, ContractLinkGenerator>();
builder.Services.AddSingleton<IContractDocumentGenerator, ContractDocumentGenerator>();
builder.Services.Configure<EmailBrandingOptions>(builder.Configuration.GetSection("EmailBranding"));
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

            app.Logger.LogInformation("Database initialized.");
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
