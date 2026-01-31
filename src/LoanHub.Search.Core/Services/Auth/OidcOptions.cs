namespace LoanHub.Search.Core.Services.Auth;

public sealed class OidcOptions
{
    public string Authority { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string Provider { get; init; } = "oidc";
    public bool RequireHttpsMetadata { get; init; } = true;
    public string? MetadataAddress { get; init; }
    public string[] ValidIssuers { get; init; } = Array.Empty<string>();
}
