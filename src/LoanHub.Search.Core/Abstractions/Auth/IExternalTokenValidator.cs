namespace LoanHub.Search.Core.Abstractions.Auth;

public interface IExternalTokenValidator
{
    Task<ExternalTokenValidationResult?> ValidateAsync(string token, CancellationToken ct);
}
