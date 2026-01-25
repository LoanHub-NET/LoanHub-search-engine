using LoanHub.Search.Core.Models.Applications;

namespace LoanHub.Search.Core.Models.Selections;

public sealed class OfferSelection
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid InquiryId { get; set; }
    public OfferSnapshot SelectedOffer { get; set; } = default!;
    public OfferSnapshot? RecalculatedOffer { get; set; }
    public decimal? Income { get; set; }
    public decimal? LivingCosts { get; set; }
    public int? Dependents { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public void ApplyRecalculation(OfferSnapshot recalculated, decimal income, decimal livingCosts, int dependents)
    {
        RecalculatedOffer = recalculated;
        Income = income;
        LivingCosts = livingCosts;
        Dependents = dependents;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
