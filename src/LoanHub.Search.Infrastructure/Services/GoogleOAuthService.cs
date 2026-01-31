using System.Net.Http.Json;
using System.Text.Json.Serialization;
using LoanHub.Search.Core.Abstractions.Auth;
using LoanHub.Search.Core.Services.Auth;
using Microsoft.Extensions.Options;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class GoogleOAuthService : IGoogleOAuthService
{
    private readonly GoogleOAuthOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;

    public GoogleOAuthService(IOptions<GoogleOAuthOptions> options, IHttpClientFactory httpClientFactory)
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string?> ExchangeCodeForIdTokenAsync(string code, string? redirectUri, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret))
            return null;

        var resolvedRedirectUri = ResolveRedirectUri(redirectUri);
        if (string.IsNullOrWhiteSpace(resolvedRedirectUri))
            return null;

        if (!string.IsNullOrWhiteSpace(_options.RedirectUri) &&
            !string.Equals(resolvedRedirectUri, _options.RedirectUri, StringComparison.Ordinal))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(_options.TokenEndpoint))
            return null;

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["redirect_uri"] = resolvedRedirectUri,
            ["grant_type"] = "authorization_code"
        });

        var client = _httpClientFactory.CreateClient(nameof(GoogleOAuthService));
        var response = await client.PostAsync(_options.TokenEndpoint, content, ct);
        if (!response.IsSuccessStatusCode)
            return null;

        var payload = await response.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken: ct);
        return payload?.IdToken;
    }

    private string? ResolveRedirectUri(string? redirectUri)
    {
        if (!string.IsNullOrWhiteSpace(_options.RedirectUri))
            return _options.RedirectUri;

        if (!string.IsNullOrWhiteSpace(redirectUri))
            return redirectUri;

        return null;
    }

    private sealed record TokenResponse(
        [property: JsonPropertyName("id_token")] string? IdToken,
        [property: JsonPropertyName("access_token")] string? AccessToken,
        [property: JsonPropertyName("expires_in")] int? ExpiresIn,
        [property: JsonPropertyName("token_type")] string? TokenType,
        [property: JsonPropertyName("refresh_token")] string? RefreshToken
    );
}
