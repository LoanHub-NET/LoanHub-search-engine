namespace LoanHub.Search.Core.Abstractions.Users;

using LoanHub.Search.Core.Models.Users;

public interface IUserRepository
{
    Task<UserAccount?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<UserAccount?> GetByEmailAsync(string email, CancellationToken ct);
    Task<UserAccount?> GetByExternalIdentityAsync(string provider, string subject, CancellationToken ct);
    Task<IReadOnlyList<UserAccount>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct);
    Task<UserAccount> AddAsync(UserAccount user, CancellationToken ct);
    Task<UserAccount?> UpdateAsync(UserAccount user, CancellationToken ct);
    Task<UserAccount?> AddExternalIdentityAsync(Guid userId, string provider, string subject, CancellationToken ct);
    Task<bool> EmailExistsAsync(string email, CancellationToken ct);
    Task<bool> ExternalIdentityExistsAsync(string provider, string subject, CancellationToken ct);
}
