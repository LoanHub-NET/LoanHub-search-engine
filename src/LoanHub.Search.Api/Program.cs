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
using LoanHub.Search.Api.Notifications;
using LoanHub.Search.Api.Options;
using LoanHub.Search.Api.Services;
using LoanHub.Search.Infrastructure;
using LoanHub.Search.Infrastructure.Providers;
using LoanHub.Search.Infrastructure.Repositories;
using LoanHub.Search.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using LoanHub.Search.Core.Models.Users;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<OidcOptions>(builder.Configuration.GetSection("Oidc"));
builder.Services.Configure<SendGridOptions>(builder.Configuration.GetSection("SendGrid"));
builder.Services.Configure<ProviderContactOptions>(builder.Configuration.GetSection("ProviderContacts"));
builder.Services.Configure<ContractStorageOptions>(builder.Configuration.GetSection("ContractStorage"));
builder.Services.Configure<ContractLinkOptions>(builder.Configuration.GetSection("ContractLinks"));
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services.AddHttpClient();
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
        policy.RequireRole(UserRole.Admin.ToString())
            .RequireClaim("is_admin", "true"));
});

builder.Services.AddSingleton<ILoanOfferProvider, MockBankOfferProvider>();
builder.Services.AddSingleton<ILoanOfferProvider, MockBank2OfferProvider>();
builder.Services.AddSingleton<OffersAggregator>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Applications")));
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<ApplicationService>();
builder.Services.AddSingleton<IContractStorage, AzureBlobContractStorage>();
builder.Services.AddScoped<IOfferSelectionRepository, OfferSelectionRepository>();
builder.Services.AddScoped<OfferSelectionService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IExternalTokenValidator, OidcTokenValidator>();
builder.Services.AddSingleton<IProviderContactResolver, ProviderContactResolver>();
builder.Services.AddSingleton<IRealtimeNotifier, SignalRApplicationNotifier>();
builder.Services.AddSingleton<IEmailTemplateRenderer, EmailTemplateRenderer>();
builder.Services.AddSingleton<IContractLinkGenerator, ContractLinkGenerator>();
builder.Services.AddSingleton<IContractDocumentGenerator, ContractDocumentGenerator>();

var sendGridOptions = builder.Configuration.GetSection("SendGrid").Get<SendGridOptions>() ?? new SendGridOptions();
if (string.IsNullOrWhiteSpace(sendGridOptions.ApiKey))
{
    builder.Services.AddSingleton<IEmailSender, NullEmailSender>();
}
else
{
    builder.Services.AddSingleton<IEmailSender, SendGridEmailSender>();
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
    var databaseCreator = dbContext.Database.GetService<IRelationalDatabaseCreator>();
    if (!databaseCreator.HasTables())
    {
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ApplicationsHub>("/hubs/applications");

app.Run();
