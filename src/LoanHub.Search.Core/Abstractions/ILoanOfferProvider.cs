namespace LoanHub.Search.Core.Abstractions;

using LoanHub.Search.Core.Models;

public interface ILoanOfferProvider
{
    string Name { get; }
    Task<IReadOnlyList<OfferDto>> GetOffersAsync(OfferQuery query, CancellationToken ct);
}
