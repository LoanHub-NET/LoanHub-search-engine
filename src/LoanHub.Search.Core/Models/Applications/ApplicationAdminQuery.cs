namespace LoanHub.Search.Core.Models.Applications;

public sealed record ApplicationAdminQuery(
    string? ApplicantEmail,
    ApplicationStatus? Status,
    string? Provider,
    DateTimeOffset? CreatedFrom,
    DateTimeOffset? CreatedTo,
    DateTimeOffset? UpdatedFrom,
    DateTimeOffset? UpdatedTo,
    int Page = 1,
    int PageSize = 20)
{
    public ApplicationAdminQuery Normalize(int maxPageSize = 200)
    {
        var normalizedPage = Page < 1 ? 1 : Page;
        var normalizedPageSize = PageSize < 1 ? 20 : Math.Min(PageSize, maxPageSize);

        return this with
        {
            Page = normalizedPage,
            PageSize = normalizedPageSize
        };
    }
}
