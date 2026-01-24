namespace LoanHub.Search.Core.Models.Applications;

public sealed record StatusHistoryEntry(
    ApplicationStatus Status,
    DateTimeOffset ChangedAt,
    string? Reason
);
