using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Abstractions.Selections;
using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Selections;

namespace LoanHub.Search.Core.Services.Selections;

public sealed class OfferSelectionService
{
    private readonly IOfferSelectionRepository _repository;
    private readonly IReadOnlyDictionary<string, ILoanOfferProvider> _providers;

    public OfferSelectionService(
        IOfferSelectionRepository repository,
        IEnumerable<ILoanOfferProvider> providers)
    {
        _repository = repository;
        _providers = providers.ToDictionary(provider => provider.Name, StringComparer.OrdinalIgnoreCase);
    }

    public Task<OfferSelection?> GetAsync(Guid id, CancellationToken ct)
        => _repository.GetAsync(id, ct);

    public Task<OfferSelection> CreateAsync(OfferSelection selection, CancellationToken ct)
        => _repository.AddAsync(selection, ct);

    public async Task<(OfferSelection? Selection, string? Error)> RecalculateAsync(
        Guid selectionId,
        decimal income,
        decimal livingCosts,
        int dependents,
        CancellationToken ct)
    {
        var selection = await _repository.GetAsync(selectionId, ct);
        if (selection is null)
            return (null, "Offer selection not found.");

        if (!_providers.TryGetValue(selection.SelectedOffer.Provider, out var provider))
            return (null, $"Provider '{selection.SelectedOffer.Provider}' not found.");

        var query = new OfferQuery(
            selection.SelectedOffer.Amount,
            selection.SelectedOffer.DurationMonths,
            income,
            livingCosts,
            dependents);

        var offers = await provider.GetOffersAsync(query, ct);
        if (offers.Count == 0)
            return (null, "Provider returned no offers for recalculation.");

        var matched = offers.FirstOrDefault(offer =>
            offer.ProviderOfferId.Equals(selection.SelectedOffer.ProviderOfferId, StringComparison.OrdinalIgnoreCase));

        var selected = matched ?? offers.First();
        var recalculated = new OfferSnapshot(
            selected.Provider,
            selected.ProviderOfferId,
            selected.Installment,
            selected.Apr,
            selected.TotalCost,
            selection.SelectedOffer.Amount,
            selection.SelectedOffer.DurationMonths,
            DateTimeOffset.UtcNow.AddDays(30));

        selection.ApplyRecalculation(recalculated, income, livingCosts, dependents);
        var updated = await _repository.UpdateAsync(selection, ct);
        return (updated, null);
    }
}
