namespace LoanHub.Search.Core.Models.Notifications;

public sealed class EmailBrandingOptions
{
    public string ProductName { get; set; } = "LoanHub";
    public string AccentColor { get; set; } = "#2d5a87";
    public string LogoUrl { get; set; } = string.Empty;
    public string PortalUrl { get; set; } = string.Empty;
    public string AdminPortalUrl { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = "support@loanhub.example";
}
