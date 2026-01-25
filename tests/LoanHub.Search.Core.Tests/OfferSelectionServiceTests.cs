using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Core.Services.Selections;
using Xunit;

namespace LoanHub.Search.Core.Tests;

public sealed class OfferSelectionServiceTests
{
    [Fact]
    public async Task RecalculateAsync_ReturnsErrorWhenSelectionMissing()
    {
        var repository = new InMemoryOfferSelectionRepository();
        var service = new OfferSelectionService(repository, Array.Empty<StubLoanOfferProvider>());

        var (selection, error) = await service.RecalculateAsync(Guid.NewGuid(), 5000m, 1500m, 1, CancellationToken.None);

        Assert.Null(selection);
        Assert.Equal("Offer selection not found.", error);
    }

    [Fact]
    public async Task RecalculateAsync_ReturnsErrorWhenProviderMissing()
    {
        var repository = new InMemoryOfferSelectionRepository();
        var selection = new OfferSelection
        {
            SelectedOffer = new OfferSnapshot("Unknown", "OFF-1", 100m, 8m, 1200m, 1000m, 12, DateTimeOffset.UtcNow.AddDays(30))
        };
        await repository.AddAsync(selection, CancellationToken.None);

        var service = new OfferSelectionService(repository, Array.Empty<StubLoanOfferProvider>());

        var (result, error) = await service.RecalculateAsync(selection.Id, 5000m, 1500m, 1, CancellationToken.None);

        Assert.Null(result);
        Assert.Equal("Provider 'Unknown' not found.", error);
    }

    [Fact]
    public async Task RecalculateAsync_ReturnsErrorWhenProviderHasNoOffers()
    {
        var repository = new InMemoryOfferSelectionRepository();
        var selection = new OfferSelection
        {
            SelectedOffer = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12, DateTimeOffset.UtcNow.AddDays(30))
        };
        await repository.AddAsync(selection, CancellationToken.None);

        var providers = new[]
        {
            new StubLoanOfferProvider("ProviderA", (_, _) => Task.FromResult<IReadOnlyList<OfferDto>>(Array.Empty<OfferDto>()))
        };

        var service = new OfferSelectionService(repository, providers);

        var (result, error) = await service.RecalculateAsync(selection.Id, 5000m, 1500m, 1, CancellationToken.None);

        Assert.Null(result);
        Assert.Equal("Provider returned no offers for recalculation.", error);
    }

    [Fact]
    public async Task RecalculateAsync_UpdatesSelectionWithRecalculatedOffer()
    {
        var repository = new InMemoryOfferSelectionRepository();
        var selection = new OfferSelection
        {
            SelectedOffer = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12, DateTimeOffset.UtcNow.AddDays(30))
        };
        await repository.AddAsync(selection, CancellationToken.None);

        var providers = new[]
        {
            new StubLoanOfferProvider("ProviderA", (_, _) => Task.FromResult<IReadOnlyList<OfferDto>>(new List<OfferDto>
            {
                new("ProviderA", "OFF-1", 90m, 7.5m, 1100m),
                new("ProviderA", "OFF-2", 95m, 7.9m, 1150m)
            }))
        };

        var service = new OfferSelectionService(repository, providers);

        var (updated, error) = await service.RecalculateAsync(selection.Id, 6000m, 1800m, 2, CancellationToken.None);

        Assert.Null(error);
        Assert.NotNull(updated);
        Assert.NotNull(updated!.RecalculatedOffer);
        Assert.Equal("OFF-1", updated.RecalculatedOffer!.ProviderOfferId);
        Assert.Equal(6000m, updated.Income);
        Assert.Equal(1800m, updated.LivingCosts);
        Assert.Equal(2, updated.Dependents);
    }
}
