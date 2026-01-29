namespace LoanHub.Search.Core.Models.Users;

using LoanHub.Search.Core.Models.Banks;

public sealed class UserAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int? Age { get; set; }
    public string? JobTitle { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public decimal? MonthlyIncome { get; set; }
    public decimal? LivingCosts { get; set; }
    public int? Dependents { get; set; }
    public string? IdDocumentNumber { get; set; }
    public string? BankName { get; set; }
    public string? BankApiEndpoint { get; set; }
    public string? BankApiKey { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<ExternalIdentity> ExternalIdentities { get; set; } = new List<ExternalIdentity>();
    public ICollection<BankAdmin> BankAdmins { get; set; } = new List<BankAdmin>();
}
