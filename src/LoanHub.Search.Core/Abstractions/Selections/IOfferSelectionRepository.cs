using LoanHub.Search.Core.Models.Selections;

namespace LoanHub.Search.Core.Abstractions.Selections;

public interface IOfferSelectionRepository
{
    Task<OfferSelection?> GetAsync(Guid id, CancellationToken ct);
    Task<OfferSelection> AddAsync(OfferSelection selection, CancellationToken ct);
    Task<OfferSelection> UpdateAsync(OfferSelection selection, CancellationToken ct);
}
