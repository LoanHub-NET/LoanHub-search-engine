namespace LoanHub.Search.Core.Models.Notifications;

public sealed record ApplicationNotification(
    Guid ApplicationId,
    string ApplicantEmail,
    string StatusLabel,
    string? Details,
    DateTimeOffset OccurredAt
);
