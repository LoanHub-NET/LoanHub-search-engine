namespace LoanHub.Search.Core.Abstractions.Auth;

public sealed record ExternalTokenValidationResult(
    string Provider,
    string Subject,
    string? Email,
    string? GivenName,
    string? FamilyName
);
