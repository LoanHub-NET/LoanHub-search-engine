namespace LoanHub.Search.Infrastructure.Persistence.Entities;

public sealed class OfferSelectionEntity
{
    public Guid Id { get; set; }
    public Guid InquiryId { get; set; }
    public OfferSnapshotEntity SelectedOffer { get; set; } = new();
    public OfferSnapshotEntity? RecalculatedOffer { get; set; }
    public decimal? Income { get; set; }
    public decimal? LivingCosts { get; set; }
    public int? Dependents { get; set; }
    public Guid? ApplicationId { get; set; }
    public DateTimeOffset? AppliedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
