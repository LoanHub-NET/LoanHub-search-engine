namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Banks;
using LoanHub.Search.Core.Models.Banks;
using LoanHub.Search.Infrastructure.Providers;
using Microsoft.EntityFrameworkCore;

public sealed class BankRepository : IBankRepository
{
    private readonly ApplicationDbContext _dbContext;

    public BankRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public Task<Bank?> GetByIdAsync(Guid id, CancellationToken ct)
        => _dbContext.Banks
            .Include(bank => bank.Admins)
            .FirstOrDefaultAsync(bank => bank.Id == id, ct);

    public Task<Bank?> GetByNameAsync(string name, CancellationToken ct)
    {
        var normalized = name.Trim();
        return _dbContext.Banks
            .Include(bank => bank.Admins)
            .FirstOrDefaultAsync(bank => EF.Functions.ILike(bank.Name, normalized), ct);
    }

    public async Task<Bank?> GetByProviderNameAsync(string providerName, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(providerName))
            return null;

        var normalized = providerName.Trim();
        return await _dbContext.Banks
            .Include(bank => bank.Admins)
            .FirstOrDefaultAsync(bank => EF.Functions.ILike(bank.Name, normalized), ct);
    }

    public async Task<Bank> UpsertAsync(Bank bank, CancellationToken ct)
    {
        var normalizedName = bank.Name.Trim();
        var existing = await _dbContext.Banks
            .FirstOrDefaultAsync(current => EF.Functions.ILike(current.Name, normalizedName), ct);

        if (existing is null)
        {
            bank.Name = normalizedName;
            bank.ApiBaseUrl = NormalizeBaseUrl(bank.ApiBaseUrl);
            bank.ApiKey = BankApiDescriptorParser.NormalizeApiKey(bank.ApiKey);
            _dbContext.Banks.Add(bank);
            await _dbContext.SaveChangesAsync(ct);
            return bank;
        }

        var updated = false;
        var baseUrl = NormalizeBaseUrl(bank.ApiBaseUrl);
        if (string.IsNullOrWhiteSpace(existing.ApiBaseUrl) && !string.IsNullOrWhiteSpace(baseUrl))
        {
            existing.ApiBaseUrl = baseUrl;
            updated = true;
        }

        var apiKey = BankApiDescriptorParser.NormalizeApiKey(bank.ApiKey);
        if (!string.IsNullOrWhiteSpace(apiKey) &&
            !string.Equals(existing.ApiKey, apiKey, StringComparison.OrdinalIgnoreCase))
        {
            existing.ApiKey = apiKey;
            updated = true;
        }

        if (updated)
        {
            existing.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }

        return existing;
    }

    public async Task<BankAdmin?> AddAdminAsync(Guid bankId, Guid userId, CancellationToken ct)
    {
        var exists = await _dbContext.BankAdmins
            .AnyAsync(admin => admin.BankId == bankId && admin.UserAccountId == userId, ct);
        if (exists)
            return await _dbContext.BankAdmins
                .AsNoTracking()
                .FirstOrDefaultAsync(admin => admin.BankId == bankId && admin.UserAccountId == userId, ct);

        var admin = new BankAdmin
        {
            BankId = bankId,
            UserAccountId = userId,
            AssignedAt = DateTimeOffset.UtcNow
        };
        _dbContext.BankAdmins.Add(admin);
        await _dbContext.SaveChangesAsync(ct);
        return admin;
    }

    public Task<bool> IsAdminAsync(Guid userId, CancellationToken ct)
        => _dbContext.BankAdmins.AnyAsync(admin => admin.UserAccountId == userId, ct);

    public async Task<IReadOnlyList<Guid>> GetBankIdsForAdminAsync(Guid userId, CancellationToken ct)
        => await _dbContext.BankAdmins
            .AsNoTracking()
            .Where(admin => admin.UserAccountId == userId)
            .Select(admin => admin.BankId)
            .Distinct()
            .ToListAsync(ct);

    private static string NormalizeBaseUrl(string raw)
    {
        var baseUrl = BankApiDescriptorParser.ExtractBaseUrl(raw);
        return string.IsNullOrWhiteSpace(baseUrl) ? string.Empty : baseUrl.Trim();
    }
}
