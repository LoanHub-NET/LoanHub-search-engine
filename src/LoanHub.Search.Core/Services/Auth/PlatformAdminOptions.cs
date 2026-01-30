namespace LoanHub.Search.Core.Services.Auth;

public sealed class PlatformAdminOptions
{
    public List<PlatformAdminCredential> Credentials { get; set; } = new();

    public sealed class PlatformAdminCredential
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
    }
}
