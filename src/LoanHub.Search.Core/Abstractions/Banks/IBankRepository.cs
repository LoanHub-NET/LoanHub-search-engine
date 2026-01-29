namespace LoanHub.Search.Core.Abstractions.Banks;

using LoanHub.Search.Core.Models.Banks;

public interface IBankRepository
{
    Task<Bank?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Bank?> GetByNameAsync(string name, CancellationToken ct);
    Task<Bank> UpsertAsync(Bank bank, CancellationToken ct);
    Task<BankAdmin?> AddAdminAsync(Guid bankId, Guid userId, CancellationToken ct);
    Task<Bank?> GetByProviderNameAsync(string providerName, CancellationToken ct);
    Task<bool> IsAdminAsync(Guid userId, CancellationToken ct);
}
