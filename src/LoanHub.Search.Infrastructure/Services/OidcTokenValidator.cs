using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LoanHub.Search.Core.Abstractions.Auth;
using LoanHub.Search.Core.Services.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class OidcTokenValidator : IExternalTokenValidator
{
    private readonly OidcOptions _options;
    private readonly JwtSecurityTokenHandler _handler = new();
    private readonly IConfigurationManager<OpenIdConnectConfiguration> _configurationManager;

    public OidcTokenValidator(IOptions<OidcOptions> options, IHttpClientFactory httpClientFactory)
    {
        _options = options.Value;
        var httpClient = httpClientFactory.CreateClient(nameof(OidcTokenValidator));
        var metadataAddress = string.IsNullOrWhiteSpace(_options.MetadataAddress)
            ? BuildMetadataAddress(_options.Authority)
            : _options.MetadataAddress;

        var documentRetriever = new HttpDocumentRetriever(httpClient)
        {
            RequireHttps = _options.RequireHttpsMetadata
        };

        _configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            metadataAddress,
            new OpenIdConnectConfigurationRetriever(),
            documentRetriever);
    }

    public async Task<ExternalTokenValidationResult?> ValidateAsync(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        OpenIdConnectConfiguration configuration;
        try
        {
            configuration = await _configurationManager.GetConfigurationAsync(ct);
        }
        catch
        {
            return null;
        }

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidAudience = _options.Audience,
            IssuerSigningKeys = configuration.SigningKeys,
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        if (_options.ValidIssuers.Length > 0)
        {
            validationParameters.ValidIssuers = _options.ValidIssuers;
        }
        else
        {
            validationParameters.ValidIssuer = configuration.Issuer;
        }

        ClaimsPrincipal principal;
        try
        {
            principal = _handler.ValidateToken(token, validationParameters, out _);
        }
        catch (SecurityTokenException)
        {
            return null;
        }

        var subject = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(subject))
            return null;

        var email = principal.FindFirstValue(JwtRegisteredClaimNames.Email)
            ?? principal.FindFirstValue("preferred_username")
            ?? principal.FindFirstValue(ClaimTypes.Email);

        var givenName = principal.FindFirstValue("given_name")
            ?? principal.FindFirstValue(ClaimTypes.GivenName);

        var familyName = principal.FindFirstValue("family_name")
            ?? principal.FindFirstValue(ClaimTypes.Surname);

        return new ExternalTokenValidationResult(
            _options.Provider,
            subject,
            email,
            givenName,
            familyName);
    }

    private static string BuildMetadataAddress(string authority)
    {
        var trimmed = authority.TrimEnd('/');
        return string.IsNullOrWhiteSpace(trimmed)
            ? string.Empty
            : $"{trimmed}/.well-known/openid-configuration";
    }
}
