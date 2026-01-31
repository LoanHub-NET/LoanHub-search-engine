namespace LoanHub.Search.Core.Models.Applications;

public sealed record ApplicationAdminQuery(
    string? ApplicantEmail,
    ApplicationStatus? Status,
    string? Provider,
    DateTimeOffset? CreatedFrom,
    DateTimeOffset? CreatedTo,
    DateTimeOffset? UpdatedFrom,
    DateTimeOffset? UpdatedTo,
    IReadOnlyList<Guid>? BankIds,
    int Page = 1,
    int PageSize = 20)
{
    public ApplicationAdminQuery Normalize(int maxPageSize = 200)
    {
        var normalizedPage = Page < 1 ? 1 : Page;
        var normalizedPageSize = PageSize < 1 ? 20 : Math.Min(PageSize, maxPageSize);
        IReadOnlyList<Guid>? normalizedBankIds = BankIds;

        if (BankIds is { Count: > 0 })
            normalizedBankIds = BankIds.Distinct().ToArray();

        return this with
        {
            Page = normalizedPage,
            PageSize = normalizedPageSize,
            BankIds = normalizedBankIds
        };
    }
}
