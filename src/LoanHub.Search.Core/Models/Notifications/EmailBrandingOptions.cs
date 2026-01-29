namespace LoanHub.Search.Core.Models.Notifications;

public sealed class EmailBrandingOptions
{
    public string ProductName { get; set; } = "LoanHub";
    public string AccentColor { get; set; } = "#2d5a87";
    public string LogoUrl { get; set; } = string.Empty;
    public string LogoPath { get; set; } = string.Empty;
    public string LogoInlineBase64 { get; set; } = string.Empty;
    public string LogoInlineContentId { get; set; } = "loanhub-logo";
    public string LogoInlineContentType { get; set; } = "image/png";
    public int LogoInlineMaxWidth { get; set; } = 720;
    public int LogoInlineMaxHeight { get; set; } = 0;
    public bool DisableInlineLogo { get; set; }
    public bool DisableHtml { get; set; }
    public List<string> PlainTextDomains { get; set; } = new();
    public string PortalUrl { get; set; } = string.Empty;
    public string AdminPortalUrl { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = "support@loanhub.example";
}
