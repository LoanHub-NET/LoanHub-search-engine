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

    public Task<bool> EmailExistsAsync(string email, CancellationToken ct)
        => _dbContext.Users.AnyAsync(user => user.Email == email, ct);

    public Task<bool> ExternalIdentityExistsAsync(string provider, string subject, CancellationToken ct)
        => _dbContext.ExternalIdentities.AnyAsync(identity => identity.Provider == provider && identity.Subject == subject, ct);
}
