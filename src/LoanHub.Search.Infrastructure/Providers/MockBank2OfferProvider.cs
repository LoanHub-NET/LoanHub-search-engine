namespace LoanHub.Search.Infrastructure.Providers;

using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Models;

public sealed class MockBank2OfferProvider : ILoanOfferProvider
{
    public string Name => "MockBank2";

    public async Task<IReadOnlyList<OfferDto>> GetOffersAsync(OfferQuery query, CancellationToken ct)
    {
        // inny czas odpowiedzi, żeby było widać równoległość
        await Task.Delay(100, ct);

        // trochę inna "logika" niż MockBank1
        var baseApr = query.Amount >= 20_000m ? 0.095m : 0.115m;

        // jeśli user poda dane szczegółowe, robimy "precyzyjniejszą" wycenę
        var riskAdj = RiskAdjustment(query);
        var apr = Clamp(baseApr + riskAdj, 0.05m, 0.25m);

        var installment = CalculateInstallment(query.Amount, apr, query.DurationMonths);
        var totalCost = installment * query.DurationMonths;
        var validUntil = OfferValidityPolicy.CalculateValidUntil(DateTimeOffset.UtcNow);

        return new[]
        {
            new OfferDto(
                Provider: Name,
                ProviderOfferId: $"MB2-STANDARD-{query.Amount}-{query.DurationMonths}",
                Installment: decimal.Round(installment, 2),
                Apr: decimal.Round(apr, 4),
                TotalCost: decimal.Round(totalCost, 2),
                ValidUntil: validUntil
            )
        };
    }

    private static decimal RiskAdjustment(OfferQuery q)
    {
        // bardzo prosty model: im mniej "luzu" finansowego, tym wyższe APR
        if (q.Income is null || q.LivingCosts is null) return 0m;

        var disposable = q.Income.Value - q.LivingCosts.Value;
        var dep = q.Dependents ?? 0;

        var adj = 0m;

        if (disposable < 1000m) adj += 0.03m;
        else if (disposable < 2000m) adj += 0.015m;
        else adj -= 0.005m;

        adj += dep * 0.003m;

        return adj;
    }

    private static decimal Clamp(decimal v, decimal min, decimal max)
        => v < min ? min : (v > max ? max : v);

    private static decimal CalculateInstallment(decimal amount, decimal apr, int months)
    {
        var r = apr / 12m;
        if (r == 0) return amount / months;

        var pow = (decimal)Math.Pow((double)(1 + r), months);
        var factor = (r * pow) / (pow - 1);
        return amount * factor;
    }
}
