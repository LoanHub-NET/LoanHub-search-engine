namespace LoanHub.Search.Core.Abstractions.Applications;

using LoanHub.Search.Core.Models.Applications;

public interface IApplicationRepository
{
    Task<LoanApplication> AddAsync(LoanApplication application, CancellationToken ct);
    Task<LoanApplication?> GetAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<LoanApplication>> ListAsync(CancellationToken ct);
    Task<LoanApplication?> UpdateAsync(LoanApplication application, CancellationToken ct);
}
