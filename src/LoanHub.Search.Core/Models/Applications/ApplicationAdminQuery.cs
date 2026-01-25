namespace LoanHub.Search.Core.Models.Applications;

public sealed record ApplicationAdminQuery(
    string? ApplicantEmail,
    ApplicationStatus? Status,
    string? Provider,
    DateTimeOffset? CreatedFrom,
    DateTimeOffset? CreatedTo,
    int Page,
    int PageSize
);
