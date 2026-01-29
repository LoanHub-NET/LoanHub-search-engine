namespace LoanHub.Search.Core.Models.Banks;

using LoanHub.Search.Core.Models.Users;

public sealed class BankAdmin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BankId { get; set; }
    public Guid UserAccountId { get; set; }
    public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;
    public Bank? Bank { get; set; }
    public UserAccount? UserAccount { get; set; }
}
