using Microsoft.Extensions.Options;

namespace LoanHub.Search.Core.Services.Auth;

public sealed class PlatformAdminAuthService
{
    private readonly PlatformAdminOptions _options;

    public PlatformAdminAuthService(IOptions<PlatformAdminOptions> options)
    {
        _options = options.Value;
    }

    public PlatformAdminAccount? Authenticate(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            return null;

        var match = _options.Credentials.FirstOrDefault(credential =>
            string.Equals(credential.Username, username, StringComparison.OrdinalIgnoreCase));

        if (match is null)
            return null;

        if (!string.Equals(match.Password, password, StringComparison.Ordinal))
            return null;

        var displayName = string.IsNullOrWhiteSpace(match.DisplayName)
            ? match.Username
            : match.DisplayName;

        return new PlatformAdminAccount(match.Username, displayName);
    }

    public sealed record PlatformAdminAccount(string Username, string DisplayName);
}
