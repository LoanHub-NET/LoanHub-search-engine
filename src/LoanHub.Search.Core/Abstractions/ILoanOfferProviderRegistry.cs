namespace LoanHub.Search.Core.Abstractions;

public interface ILoanOfferProviderRegistry
{
    Task<IReadOnlyList<ILoanOfferProvider>> GetProvidersAsync(CancellationToken ct);
    Task<ILoanOfferProvider?> GetProviderAsync(string name, CancellationToken ct);
}
