namespace LoanHub.Search.Infrastructure.Persistence.Entities;

public sealed class ExternalIdentityEntity
{
    public Guid Id { get; set; }
    public Guid UserAccountId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public UserAccountEntity? UserAccount { get; set; }
}
