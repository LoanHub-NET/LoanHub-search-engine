namespace LoanHub.Search.Infrastructure.Persistence.Entities;

public sealed class StatusHistoryEntryEntity
{
    public int Id { get; set; }
    public Guid LoanApplicationId { get; set; }
    public int Status { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
    public string? Reason { get; set; }
}
