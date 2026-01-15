namespace LoanHub.Search.Core.Models;

public sealed record OfferDto(
    string Provider,
    string ProviderOfferId,
    decimal Installment,
    decimal Apr,
    decimal TotalCost
);
