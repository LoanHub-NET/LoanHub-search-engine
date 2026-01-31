using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Services;
using Xunit;

namespace LoanHub.Search.Core.Tests;

public sealed class OffersAggregatorTests
{
    [Fact]
    public async Task GetOffersAsync_AggregatesOffersFromProviders()
    {
        var validUntil = DateTimeOffset.UtcNow.AddDays(10);
        var providers = new List<StubLoanOfferProvider>
        {
            new("FastOne", (_, _) => Task.FromResult<IReadOnlyList<OfferDto>>(new List<OfferDto>
            {
                new("FastOne", "FAST-1", 120m, 9.5m, 1500m, validUntil)
            })),
            new("FastTwo", (_, _) => Task.FromResult<IReadOnlyList<OfferDto>>(new List<OfferDto>
            {
                new("FastTwo", "FAST-2", 110m, 8.1m, 1400m, validUntil)
            }))
        };

        var registry = new StubLoanOfferProviderRegistry(providers);
        var aggregator = new OffersAggregator(registry);

        var (offers, sources) = await aggregator.GetOffersAsync(
            new OfferQuery(1000m, 12, 4000m, 1500m, 0),
            TimeSpan.FromMilliseconds(200),
            CancellationToken.None);

        Assert.Equal(2, offers.Count);
        Assert.Equal(2, sources.Count);
        Assert.All(sources, source => Assert.Equal("Ok", source.Status));
    }

    [Fact]
    public async Task GetOffersAsync_ReportsProviderErrorsAndTimeouts()
    {
        var providers = new List<StubLoanOfferProvider>
        {
            new("Failing", (_, _) => throw new InvalidOperationException("boom")),
            new("Slow", async (_, ct) =>
            {
                await Task.Delay(TimeSpan.FromMilliseconds(200), ct);
                return Array.Empty<OfferDto>();
            })
        };

        var registry = new StubLoanOfferProviderRegistry(providers);
        var aggregator = new OffersAggregator(registry);

        var (offers, sources) = await aggregator.GetOffersAsync(
            new OfferQuery(1000m, 12, 4000m, 1500m, 0),
            TimeSpan.FromMilliseconds(50),
            CancellationToken.None);

        Assert.Empty(offers);
        Assert.Equal(2, sources.Count);
        Assert.Contains(sources, source => source.Provider == "Failing" && source.Status == "Error");
        Assert.Contains(sources, source => source.Provider == "Slow" && source.Status == "TimeoutOrCanceled");
    }
}
