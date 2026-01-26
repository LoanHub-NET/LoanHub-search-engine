namespace LoanHub.Search.Infrastructure.Persistence.Entities;

public sealed class OfferSnapshotEntity
{
    public string Provider { get; set; } = string.Empty;
    public string ProviderOfferId { get; set; } = string.Empty;
    public decimal Installment { get; set; }
    public decimal Apr { get; set; }
    public decimal TotalCost { get; set; }
    public decimal Amount { get; set; }
    public int DurationMonths { get; set; }
    public DateTimeOffset ValidUntil { get; set; }
}
