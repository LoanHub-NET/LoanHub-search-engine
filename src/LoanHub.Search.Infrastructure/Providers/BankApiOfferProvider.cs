namespace LoanHub.Search.Infrastructure.Providers;

using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Models;

public sealed record BankApiDescriptor(string Name, string ApiEndpoint, string? ApiKey);

public sealed class BankApiOfferProvider : ILoanOfferProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly BankApiDescriptor _bank;
    private readonly HttpClient _httpClient;

    public BankApiOfferProvider(BankApiDescriptor bank, HttpClient httpClient)
    {
        _bank = bank;
        _httpClient = httpClient;
    }

    public string Name => _bank.Name;

    public async Task<IReadOnlyList<OfferDto>> GetOffersAsync(OfferQuery query, CancellationToken ct)
    {
        var requestUri = BuildRequestUri(_bank.ApiEndpoint, query);
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        request.Headers.Accept.Clear();
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/plain"));
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (!string.IsNullOrWhiteSpace(_bank.ApiKey))
            request.Headers.Add("X-Api-Key", _bank.ApiKey);

        using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!response.IsSuccessStatusCode)
        {
            var status = (int)response.StatusCode;
            throw new InvalidOperationException($"Bank API '{_bank.Name}' returned status {status}.");
        }

        var content = await response.Content.ReadAsStringAsync(ct);
        IReadOnlyList<BankApiOffer> apiOffers;
        try
        {
            apiOffers = BankApiOfferParser.ReadOffers(content);
        }
        catch (JsonException ex)
        {
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "unknown";
            var preview = SanitizePreview(content);
            throw new InvalidOperationException(
                $"Bank API '{_bank.Name}' returned non-JSON response (Content-Type: {contentType}). Preview: {preview}", ex);
        }
        if (apiOffers.Count == 0)
            return Array.Empty<OfferDto>();

        var validUntil = OfferValidityPolicy.CalculateValidUntil(DateTimeOffset.UtcNow);
        var results = new List<OfferDto>();

        foreach (var offer in apiOffers)
        {
            if (offer.IsActive == false)
                continue;

            if (offer.DurationInMonths > 0 && offer.DurationInMonths != query.DurationMonths)
                continue;

            var aprPercent = NormalizeAprPercent(offer.InterestRate);
            var installment = CalculateInstallment(query.Amount, aprPercent, query.DurationMonths);
            var totalCost = installment * query.DurationMonths;
            var providerOfferId = BuildProviderOfferId(offer);

            results.Add(new OfferDto(
                Provider: _bank.Name,
                ProviderOfferId: providerOfferId,
                Installment: decimal.Round(installment, 2),
                Apr: decimal.Round(aprPercent, 4),
                TotalCost: decimal.Round(totalCost, 2),
                ValidUntil: validUntil));
        }

        return results;
    }

    private static string BuildRequestUri(string endpoint, OfferQuery query)
    {
        var parameters = new Dictionary<string, string>
        {
            ["amount"] = query.Amount.ToString(CultureInfo.InvariantCulture),
            ["durationInMonths"] = query.DurationMonths.ToString(CultureInfo.InvariantCulture)
        };

        if (query.Income.HasValue)
            parameters["income"] = query.Income.Value.ToString(CultureInfo.InvariantCulture);

        if (query.LivingCosts.HasValue)
            parameters["livingCosts"] = query.LivingCosts.Value.ToString(CultureInfo.InvariantCulture);

        if (query.Dependents.HasValue)
            parameters["dependents"] = query.Dependents.Value.ToString(CultureInfo.InvariantCulture);

        var queryString = string.Join("&",
            parameters.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

        if (string.IsNullOrWhiteSpace(queryString))
            return endpoint;

        if (endpoint.Contains('?'))
            return endpoint.EndsWith('?') || endpoint.EndsWith('&')
                ? $"{endpoint}{queryString}"
                : $"{endpoint}&{queryString}";

        return $"{endpoint}?{queryString}";
    }

    private static decimal NormalizeAprPercent(decimal interestRate)
        => interestRate <= 1m ? interestRate * 100m : interestRate;

    private static decimal CalculateInstallment(decimal amount, decimal aprPercent, int months)
    {
        var annualRate = aprPercent / 100m;
        var monthlyRate = annualRate / 12m;
        if (monthlyRate == 0m)
            return amount / months;

        var pow = (decimal)Math.Pow((double)(1 + monthlyRate), months);
        var factor = (monthlyRate * pow) / (pow - 1);
        return amount * factor;
    }

    private static string SanitizePreview(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return "(empty)";

        var trimmed = content.Trim();
        var preview = trimmed.Length > 200 ? $"{trimmed[..200]}..." : trimmed;
        var normalized = preview
            .Replace("\r", " ")
            .Replace("\n", " ")
            .Replace("\t", " ");

        return normalized;
    }

    private static string BuildProviderOfferId(BankApiOffer offer)
    {
        var offerId = ReadIdentifier(offer.Id);
        if (!string.IsNullOrWhiteSpace(offerId))
            return offerId;

        var bankId = offer.Bank is null ? ReadIdentifier(offer.BankId) : ReadIdentifier(offer.Bank.Id);
        if (string.IsNullOrWhiteSpace(bankId))
            bankId = "bank";

        return $"{bankId}-{offer.DurationInMonths}-{offer.Amount}-{offer.InterestRate}";
    }

    private static string? ReadIdentifier(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.GetRawText(),
            _ => null
        };
    }

    private sealed class BankApiOffer
    {
        public JsonElement Id { get; init; }
        public JsonElement BankId { get; init; }
        public BankApiBank? Bank { get; init; }
        public decimal Amount { get; init; }
        public decimal InterestRate { get; init; }
        public int DurationInMonths { get; init; }
        public bool? IsActive { get; init; }
        public DateTimeOffset? CreatedAt { get; init; }
        public DateTimeOffset? UpdatedAt { get; init; }
    }

    private sealed class BankApiBank
    {
        public JsonElement Id { get; init; }
        public string Name { get; init; } = string.Empty;
    }

    private static class BankApiOfferParser
    {
        public static IReadOnlyList<BankApiOffer> ReadOffers(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return Array.Empty<BankApiOffer>();

            using var document = JsonDocument.Parse(content);
            var root = document.RootElement;

            if (root.ValueKind == JsonValueKind.Array)
                return DeserializeList(root);

            if (root.ValueKind == JsonValueKind.Object)
            {
                if (TryGetArray(root, "bankOffers", out var offers) ||
                    TryGetArray(root, "offers", out offers) ||
                    TryGetArray(root, "items", out offers) ||
                    TryGetArray(root, "data", out offers))
                {
                    return DeserializeList(offers);
                }

                var single = root.Deserialize<BankApiOffer>(JsonOptions);
                if (single is not null)
                    return new[] { single };
            }

            return Array.Empty<BankApiOffer>();
        }

        private static bool TryGetArray(JsonElement root, string name, out JsonElement array)
        {
            if (root.TryGetProperty(name, out array) && array.ValueKind == JsonValueKind.Array)
                return true;

            foreach (var property in root.EnumerateObject())
            {
                if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                    property.Value.ValueKind == JsonValueKind.Array)
                {
                    array = property.Value;
                    return true;
                }
            }

            array = default;
            return false;
        }

        private static IReadOnlyList<BankApiOffer> DeserializeList(JsonElement array)
        {
            var list = array.Deserialize<List<BankApiOffer>>(JsonOptions);
            return list ?? new List<BankApiOffer>();
        }
    }
}
