namespace LoanHub.Search.Infrastructure.Providers;

using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Models;
using System.Security.AccessControl;

public sealed class MockBankOfferProvider : ILoanOfferProvider
{
    public string Name => "MockBank1";

    public async Task<IReadOnlyList<OfferDto>> GetOffersAsync(OfferQuery query, CancellationToken ct)
    {
        await Task.Delay(200, ct);

        var apr = query.Amount > 50_000 ? 0.12m : 0.10m;
        var installment = CalculateInstallment(query.Amount, apr, query.DurationMonths);
        var totalCost = installment * query.DurationMonths;

        var apr2 = query.Amount > 30_000 ? 0.10m : 0.07m;
        var installment2 = CalculateInstallment(query.Amount, apr2, query.DurationMonths);
        var totalCost2 = installment2 * query.DurationMonths;


        return new[]
        {
            new OfferDto(
                Provider: Name,
                ProviderOfferId: $"MOCK-{query.Amount}-{query.DurationMonths}",
                Installment: decimal.Round(installment, 2),
                Apr: apr,
                TotalCost: decimal.Round(totalCost, 2)
            ),
            new OfferDto(
                Provider:Name,
                ProviderOfferId: $"Mock premium-{query.Amount}-{query.DurationMonths}",
                Installment: decimal.Round(installment2,2),
                Apr: apr2,
                TotalCost: decimal.Round(totalCost2,2)
                )
        };
    }

    private static decimal CalculateInstallment(decimal amount, decimal apr, int months)
    {
        var r = apr / 12m;
        if (r == 0) return amount / months;

        var pow = (decimal)Math.Pow((double)(1 + r), months);
        var factor = (r * pow) / (pow - 1);
        return amount * factor;
    }
}
