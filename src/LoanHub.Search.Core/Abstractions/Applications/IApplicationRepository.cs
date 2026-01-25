namespace LoanHub.Search.Core.Abstractions.Applications;

using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Pagination;

public interface IApplicationRepository
{
    Task<LoanApplication> AddAsync(LoanApplication application, CancellationToken ct);
    Task<LoanApplication?> GetAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<LoanApplication>> ListAsync(CancellationToken ct);
    Task<PagedResult<LoanApplication>> ListAdminAsync(ApplicationAdminQuery query, CancellationToken ct);
    Task<LoanApplication?> UpdateAsync(LoanApplication application, CancellationToken ct);
}
