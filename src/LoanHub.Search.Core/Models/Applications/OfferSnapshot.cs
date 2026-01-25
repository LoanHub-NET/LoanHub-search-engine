using LoanHub.Search.Core.Models;

namespace LoanHub.Search.Core.Models.Applications;

public sealed record OfferSnapshot(
    string Provider,
    string ProviderOfferId,
    decimal Installment,
    decimal Apr,
    decimal TotalCost,
    decimal Amount,
    int DurationMonths,
    DateTimeOffset ValidUntil
)
{
    public bool IsExpired(DateTimeOffset now)
        => OfferValidityPolicy.IsExpired(ValidUntil, now);
}
