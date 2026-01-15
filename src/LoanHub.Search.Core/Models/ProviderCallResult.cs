namespace LoanHub.Search.Core.Models;

public sealed record ProviderCallResult(
    string Provider,
    string Status,
    long DurationMs,
    string? Error
);
