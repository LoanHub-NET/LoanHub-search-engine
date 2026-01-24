namespace LoanHub.Search.Core.Models.Applications;

public sealed record OfferSnapshot(
    string Provider,
    string ProviderOfferId,
    decimal Installment,
    decimal Apr,
    decimal TotalCost,
    decimal Amount,
    int DurationMonths
);
