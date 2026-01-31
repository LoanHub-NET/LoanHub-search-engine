namespace LoanHub.Search.Core.Abstractions.Auth;

public interface IGoogleOAuthService
{
    Task<string?> ExchangeCodeForIdTokenAsync(string code, string? redirectUri, CancellationToken ct);
}
