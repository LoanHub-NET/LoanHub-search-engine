namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Infrastructure.Persistence.Mapping;
using Microsoft.EntityFrameworkCore;

public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UserRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public async Task<UserAccount?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await _dbContext.Users
            .Include(user => user.ExternalIdentities)
            .FirstOrDefaultAsync(user => user.Id == id, ct);

        return entity?.ToModel();
    }

    public async Task<UserAccount?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var entity = await _dbContext.Users
            .Include(user => user.ExternalIdentities)
            .FirstOrDefaultAsync(user => user.Email == email, ct);

        return entity?.ToModel();
    }

    public async Task<UserAccount?> GetByExternalIdentityAsync(string provider, string subject, CancellationToken ct)
    {
        var entity = await _dbContext.Users
            .Include(user => user.ExternalIdentities)
            .FirstOrDefaultAsync(user => user.ExternalIdentities.Any(identity =>
                identity.Provider == provider && identity.Subject == subject), ct);

        return entity?.ToModel();
    }

    public async Task<UserAccount> AddAsync(UserAccount user, CancellationToken ct)
    {
        var entity = user.ToEntity();
        _dbContext.Users.Add(entity);
        await _dbContext.SaveChangesAsync(ct);
        return entity.ToModel();
    }

    public async Task<UserAccount?> UpdateAsync(UserAccount user, CancellationToken ct)
    {
        var exists = await _dbContext.Users.AnyAsync(current => current.Id == user.Id, ct);
        if (!exists)
            return null;

        var entity = user.ToEntity();
        _dbContext.Users.Update(entity);
        await _dbContext.SaveChangesAsync(ct);
        return entity.ToModel();
    }

    public Task<bool> EmailExistsAsync(string email, CancellationToken ct)
        => _dbContext.Users.AnyAsync(user => user.Email == email, ct);

    public Task<bool> ExternalIdentityExistsAsync(string provider, string subject, CancellationToken ct)
        => _dbContext.ExternalIdentities.AnyAsync(identity => identity.Provider == provider && identity.Subject == subject, ct);
}
