namespace LoanHub.Search.Core.Models;

public sealed record OfferQuery(
    decimal Amount,
    int DurationMonths,
    decimal? Income,
    decimal? LivingCosts,
    int? Dependents
);
