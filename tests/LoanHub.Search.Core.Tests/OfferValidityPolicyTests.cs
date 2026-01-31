using LoanHub.Search.Core.Models;
using Xunit;

namespace LoanHub.Search.Core.Tests;

public sealed class OfferValidityPolicyTests
{
    [Fact]
    public void CalculateValidUntil_AddsValidityPeriod()
    {
        var now = new DateTimeOffset(2025, 1, 1, 12, 0, 0, TimeSpan.Zero);

        var validUntil = OfferValidityPolicy.CalculateValidUntil(now);

        Assert.Equal(now.AddDays(10), validUntil);
    }

    [Fact]
    public void IsExpired_ReturnsTrueWhenNowEqualsValidUntil()
    {
        var now = new DateTimeOffset(2025, 1, 1, 12, 0, 0, TimeSpan.Zero);

        var result = OfferValidityPolicy.IsExpired(now, now);

        Assert.True(result);
    }

    [Fact]
    public void IsExpired_ReturnsFalseWhenValidUntilInFuture()
    {
        var now = new DateTimeOffset(2025, 1, 1, 12, 0, 0, TimeSpan.Zero);
        var validUntil = now.AddMinutes(1);

        var result = OfferValidityPolicy.IsExpired(validUntil, now);

        Assert.False(result);
    }
}