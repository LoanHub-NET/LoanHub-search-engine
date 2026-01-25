namespace LoanHub.Search.Core.Models;

public static class OfferValidityPolicy
{
    public static readonly TimeSpan ValidityPeriod = TimeSpan.FromDays(10);

    public static DateTimeOffset CalculateValidUntil(DateTimeOffset now)
        => now.Add(ValidityPeriod);

    public static bool IsExpired(DateTimeOffset validUntil, DateTimeOffset now)
        => validUntil <= now;
}
