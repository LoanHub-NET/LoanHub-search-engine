namespace LoanHub.Search.Infrastructure.Providers;

using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Models.Users;
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
        var raw = await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.Admin &&
                user.BankName != null &&
                user.BankApiEndpoint != null)
            .OrderBy(user => user.CreatedAt)
            .Select(user => new
            {
                user.BankName,
                user.BankApiEndpoint,
                user.BankApiKey
            })
            .ToListAsync(ct);

        var descriptors = new List<BankApiDescriptor>();
        foreach (var entry in raw)
        {
            if (TryBuildDescriptor(entry.BankName, entry.BankApiEndpoint, entry.BankApiKey, out var descriptor))
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
        var baseUrl = ExtractBaseUrl(endpointRaw);
        if (string.IsNullOrWhiteSpace(baseUrl))
            return false;

        var endpoint = NormalizeEndpoint(baseUrl);
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out _))
            return false;

        var apiKey = ExtractApiKey(apiKeyRaw);
        descriptor = new BankApiDescriptor(name, endpoint, NormalizeApiKey(apiKey));
        return true;
    }

    private static string? ExtractBaseUrl(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        var markerIndex = raw.IndexOf("@baseUrl", StringComparison.OrdinalIgnoreCase);
        if (markerIndex < 0)
            return raw.Trim();

        foreach (var line in raw.Split('\n'))
        {
            var trimmed = line.Trim();
            if (trimmed.StartsWith("@baseUrl", StringComparison.OrdinalIgnoreCase))
            {
                var value = ExtractValue(trimmed);
                return string.IsNullOrWhiteSpace(value) ? null : value;
            }
        }

        return null;
    }

    private static string? ExtractApiKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        var markerIndex = raw.IndexOf("@apiKey", StringComparison.OrdinalIgnoreCase);
        if (markerIndex < 0)
            return raw.Trim();

        foreach (var line in raw.Split('\n'))
        {
            var trimmed = line.Trim();
            if (trimmed.StartsWith("@apiKey", StringComparison.OrdinalIgnoreCase))
            {
                var value = ExtractValue(trimmed);
                return string.IsNullOrWhiteSpace(value) ? null : value;
            }
        }

        return null;
    }

    private static string? ExtractValue(string line)
    {
        var index = line.IndexOf('=', StringComparison.Ordinal);
        if (index < 0 || index == line.Length - 1)
            return null;

        var value = line[(index + 1)..].Trim();
        if (value.Length >= 2 &&
            ((value.StartsWith('"') && value.EndsWith('"')) ||
             (value.StartsWith('\'') && value.EndsWith('\''))))
        {
            value = value[1..^1].Trim();
        }

        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static string NormalizeEndpoint(string raw)
    {
        var trimmed = raw.Trim();
        if (trimmed.Contains("/api/BankOffers", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        trimmed = trimmed.TrimEnd('/');
        return $"{trimmed}/api/BankOffers";
    }

    private static string? NormalizeApiKey(string? apiKey)
        => string.IsNullOrWhiteSpace(apiKey) ? null : apiKey.Trim();
}
