namespace LoanHub.Search.Infrastructure.Services;

public sealed class ProviderContactOptions
{
    public Dictionary<string, string> Contacts { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
