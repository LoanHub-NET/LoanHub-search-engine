namespace LoanHub.Search.Infrastructure.Persistence.Entities;

public sealed class UserAccountEntity
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public int Role { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int? Age { get; set; }
    public string? JobTitle { get; set; }
    public string? Address { get; set; }
    public string? IdDocumentNumber { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<ExternalIdentityEntity> ExternalIdentities { get; set; } = new List<ExternalIdentityEntity>();
}
