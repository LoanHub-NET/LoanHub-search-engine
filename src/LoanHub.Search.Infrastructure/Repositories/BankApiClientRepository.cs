using LoanHub.Search.Core.Abstractions.Banks;
using LoanHub.Search.Core.Models.Banks;
using Microsoft.EntityFrameworkCore;

namespace LoanHub.Search.Infrastructure.Repositories;

public sealed class BankApiClientRepository : IBankApiClientRepository
{
    private readonly ApplicationDbContext _dbContext;

    public BankApiClientRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public async Task<BankApiClient> AddAsync(BankApiClient client, CancellationToken ct)
    {
        _dbContext.BankApiClients.Add(client);
        await _dbContext.SaveChangesAsync(ct);
        return client;
    }

    public async Task<BankApiClient?> UpdateAsync(BankApiClient client, CancellationToken ct)
    {
        var exists = await _dbContext.BankApiClients.AnyAsync(current => current.Id == client.Id, ct);
        if (!exists)
            return null;

        _dbContext.BankApiClients.Update(client);
        await _dbContext.SaveChangesAsync(ct);
        return client;
    }

    public Task<BankApiClient?> GetByIdAsync(Guid id, CancellationToken ct)
        => _dbContext.BankApiClients.FirstOrDefaultAsync(client => client.Id == id, ct);

    public Task<BankApiClient?> GetByKeyHashAsync(string keyHash, CancellationToken ct)
        => _dbContext.BankApiClients.FirstOrDefaultAsync(client => client.KeyHash == keyHash, ct);

    public async Task<IReadOnlyList<BankApiClient>> ListAsync(CancellationToken ct)
        => await _dbContext.BankApiClients
            .AsNoTracking()
            .OrderByDescending(client => client.CreatedAt)
            .ToListAsync(ct);
}
