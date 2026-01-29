namespace LoanHub.Search.Infrastructure.Providers;

public static class BankApiDescriptorParser
{
    public static string? ExtractBaseUrl(string? raw)
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

    public static string? ExtractApiKey(string? raw)
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

    public static string NormalizeEndpoint(string raw)
    {
        var trimmed = raw.Trim();
        if (trimmed.Contains("/api/BankOffers", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        trimmed = trimmed.TrimEnd('/');
        return $"{trimmed}/api/BankOffers";
    }

    public static string? NormalizeApiKey(string? apiKey)
        => string.IsNullOrWhiteSpace(apiKey) ? null : apiKey.Trim();

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
}
