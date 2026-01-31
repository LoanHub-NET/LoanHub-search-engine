namespace LoanHub.Search.Infrastructure.Providers;

using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Models.Banks;
using LoanHub.Search.Infrastructure;
using Microsoft.EntityFrameworkCore;

public sealed class BankApiOfferProviderRegistry : ILoanOfferProviderRegistry
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IHttpClientFactory _httpClientFactory;

    public BankApiOfferProviderRegistry(ApplicationDbContext dbContext, IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<IReadOnlyList<ILoanOfferProvider>> GetProvidersAsync(CancellationToken ct)
    {
        var banks = await LoadBankDescriptorsAsync(ct);
        if (banks.Count == 0)
            return Array.Empty<ILoanOfferProvider>();

        var client = _httpClientFactory.CreateClient("BankApi");
        return banks.Select(bank => new BankApiOfferProvider(bank, client)).ToList();
    }

    public async Task<ILoanOfferProvider?> GetProviderAsync(string name, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name))
            return null;

        var providers = await GetProvidersAsync(ct);
        return providers.FirstOrDefault(provider =>
            provider.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<IReadOnlyList<BankApiDescriptor>> LoadBankDescriptorsAsync(CancellationToken ct)
    {
        var raw = await _dbContext.Banks
            .AsNoTracking()
            .OrderBy(bank => bank.CreatedAt)
            .Select(user => new
            {
                user.Name,
                user.ApiBaseUrl,
                user.ApiKey
            })
            .ToListAsync(ct);

        var descriptors = new List<BankApiDescriptor>();
        foreach (var entry in raw)
        {
            if (TryBuildDescriptor(entry.Name, entry.ApiBaseUrl, entry.ApiKey, out var descriptor))
                descriptors.Add(descriptor);
        }

        return descriptors
            .GroupBy(bank => bank.Name, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToList();
    }

    private static bool TryBuildDescriptor(
        string? bankName,
        string? endpointRaw,
        string? apiKeyRaw,
        out BankApiDescriptor descriptor)
    {
        descriptor = default!;
        if (string.IsNullOrWhiteSpace(bankName) || string.IsNullOrWhiteSpace(endpointRaw))
            return false;

        var name = bankName.Trim();
        var baseUrl = BankApiDescriptorParser.ExtractBaseUrl(endpointRaw);
        if (string.IsNullOrWhiteSpace(baseUrl))
            return false;

        var endpoint = BankApiDescriptorParser.NormalizeEndpoint(baseUrl);
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out _))
            return false;

        var apiKey = BankApiDescriptorParser.ExtractApiKey(apiKeyRaw);
        descriptor = new BankApiDescriptor(name, endpoint, BankApiDescriptorParser.NormalizeApiKey(apiKey));
        return true;
    }
}
