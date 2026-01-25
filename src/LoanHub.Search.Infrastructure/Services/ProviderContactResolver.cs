using LoanHub.Search.Core.Abstractions.Notifications;
using Microsoft.Extensions.Options;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class ProviderContactResolver : IProviderContactResolver
{
    private readonly ProviderContactOptions _options;

    public ProviderContactResolver(IOptions<ProviderContactOptions> options)
        => _options = options.Value;

    public string? GetContactEmail(string provider)
        => _options.Contacts.TryGetValue(provider, out var email) ? email : null;
}
