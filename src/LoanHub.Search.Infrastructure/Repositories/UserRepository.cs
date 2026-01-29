namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models.Users;
using Microsoft.EntityFrameworkCore;

public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UserRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public Task<UserAccount?> GetByIdAsync(Guid id, CancellationToken ct)
        => _dbContext.Users
            .Include(user => user.ExternalIdentities)
            .FirstOrDefaultAsync(user => user.Id == id, ct);

    public Task<UserAccount?> GetByEmailAsync(string email, CancellationToken ct)
        => _dbContext.Users
            .Include(user => user.ExternalIdentities)
            .FirstOrDefaultAsync(user => user.Email == email, ct);

    public Task<UserAccount?> GetByExternalIdentityAsync(string provider, string subject, CancellationToken ct)
        => _dbContext.Users
            .Include(user => user.ExternalIdentities)
            .FirstOrDefaultAsync(user => user.ExternalIdentities.Any(identity =>
                identity.Provider == provider && identity.Subject == subject), ct);

    public async Task<IReadOnlyList<UserAccount>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct)
    {
        var idList = ids.Distinct().ToList();
        if (idList.Count == 0)
            return Array.Empty<UserAccount>();

        return await _dbContext.Users
            .AsNoTracking()
            .Where(user => idList.Contains(user.Id))
            .ToListAsync(ct);
    }

    public async Task<UserAccount> AddAsync(UserAccount user, CancellationToken ct)
    {
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(ct);
        return user;
    }

    public async Task<UserAccount?> UpdateAsync(UserAccount user, CancellationToken ct)
    {
        var exists = await _dbContext.Users.AnyAsync(current => current.Id == user.Id, ct);
        if (!exists)
            return null;

        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync(ct);
        return user;
    }

    public async Task<UserAccount?> AddExternalIdentityAsync(Guid userId, string provider, string subject, CancellationToken ct)
    {
        var userExists = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(current => current.Id == userId, ct);
        if (!userExists)
            return null;

        var identityExists = await _dbContext.ExternalIdentities
            .AsNoTracking()
            .AnyAsync(identity => identity.Provider == provider && identity.Subject == subject, ct);
        if (identityExists)
            return await GetByIdAsync(userId, ct);

        _dbContext.ExternalIdentities.Add(new ExternalIdentity
        {
            Provider = provider,
            Subject = subject,
            UserAccountId = userId
        });

        await _dbContext.SaveChangesAsync(ct);
        return await GetByIdAsync(userId, ct);
    }

    public Task<bool> EmailExistsAsync(string email, CancellationToken ct)
        => _dbContext.Users.AnyAsync(user => user.Email == email, ct);

    public Task<bool> ExternalIdentityExistsAsync(string provider, string subject, CancellationToken ct)
        => _dbContext.ExternalIdentities.AnyAsync(identity => identity.Provider == provider && identity.Subject == subject, ct);
}
