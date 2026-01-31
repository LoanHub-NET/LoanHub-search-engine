using LoanHub.Search.Core.Models.Banks;

namespace LoanHub.Search.Core.Abstractions.Banks;

public interface IBankApiClientRepository
{
    Task<BankApiClient> AddAsync(BankApiClient client, CancellationToken ct);
    Task<BankApiClient?> UpdateAsync(BankApiClient client, CancellationToken ct);
    Task<BankApiClient?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<BankApiClient?> GetByKeyHashAsync(string keyHash, CancellationToken ct);
    Task<IReadOnlyList<BankApiClient>> ListAsync(CancellationToken ct);
}
