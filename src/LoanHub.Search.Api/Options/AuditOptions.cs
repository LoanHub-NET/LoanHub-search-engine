namespace LoanHub.Search.Api.Options;

public sealed class AuditOptions
{
    public bool Enabled { get; set; } = true;
    public int MaxBodySizeBytes { get; set; } = 16384;
    public int RetentionDays { get; set; } = 30;
}
