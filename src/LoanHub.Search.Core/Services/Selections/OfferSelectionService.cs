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

        if (selection.ApplicationId is not null)
            return (null, "Offer selection already applied.");

        if (selection.SelectedOffer.IsExpired(DateTimeOffset.UtcNow))
            return (null, "Offer has expired.");

        var (recalculated, error) = await RefreshOfferAsync(selection, income, livingCosts, dependents, ct);
        if (recalculated is null)
            return (null, error);

        selection.ApplyRecalculation(recalculated, income, livingCosts, dependents);
        var updated = await _repository.UpdateAsync(selection, ct);
        return (updated, null);
    }

    public async Task<(OfferSelection? Selection, OfferSnapshot? Offer, string? Error)> PrepareForApplicationAsync(
        Guid selectionId,
        CancellationToken ct)
    {
        var selection = await _repository.GetAsync(selectionId, ct);
        if (selection is null)
            return (null, null, "Offer selection not found.");

        if (selection.ApplicationId is not null)
            return (selection, null, "Offer selection already applied.");

        if (selection.Income is null || selection.LivingCosts is null || selection.Dependents is null)
            return (selection, null, "Detailed offer data missing. Recalculate the offer before applying.");

        var offer = selection.RecalculatedOffer;
        if (offer is null || offer.IsExpired(DateTimeOffset.UtcNow))
        {
            var (recalculated, error) = await RefreshOfferAsync(
                selection,
                selection.Income.Value,
                selection.LivingCosts.Value,
                selection.Dependents.Value,
                ct);

            if (recalculated is null)
                return (selection, null, error);

            selection.ApplyRecalculation(
                recalculated,
                selection.Income.Value,
                selection.LivingCosts.Value,
                selection.Dependents.Value);

            selection = await _repository.UpdateAsync(selection, ct);
            offer = selection.RecalculatedOffer;
        }

        if (offer is null)
            return (selection, null, "Offer recalculation failed.");

        if (offer.IsExpired(DateTimeOffset.UtcNow))
            return (selection, null, "Offer has expired.");

        return (selection, offer, null);
    }

    public async Task<OfferSelection?> MarkAppliedAsync(
        OfferSelection selection,
        Guid applicationId,
        CancellationToken ct)
    {
        selection.MarkApplied(applicationId);
        return await _repository.UpdateAsync(selection, ct);
    }

    private async Task<(OfferSnapshot? Recalculated, string? Error)> RefreshOfferAsync(
        OfferSelection selection,
        decimal income,
        decimal livingCosts,
        int dependents,
        CancellationToken ct)
    {
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
        var validUntil = selection.SelectedOffer.ValidUntil <= selected.ValidUntil
            ? selection.SelectedOffer.ValidUntil
            : selected.ValidUntil;
        var recalculated = new OfferSnapshot(
            selected.Provider,
            selected.ProviderOfferId,
            selected.Installment,
            selected.Apr,
            selected.TotalCost,
            selection.SelectedOffer.Amount,
            selection.SelectedOffer.DurationMonths,
            validUntil);

        return (recalculated, null);
    }
}
