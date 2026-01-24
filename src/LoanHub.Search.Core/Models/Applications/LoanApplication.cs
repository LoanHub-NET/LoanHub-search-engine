namespace LoanHub.Search.Core.Models.Applications;

public sealed class LoanApplication
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string ApplicantEmail { get; set; } = string.Empty;
    public ApplicantDetails ApplicantDetails { get; set; } = default!;
    public OfferSnapshot OfferSnapshot { get; set; } = default!;
    public ApplicationStatus Status { get; set; } = ApplicationStatus.New;
    public string? RejectReason { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<StatusHistoryEntry> StatusHistory { get; } = new();

    public void AddStatus(ApplicationStatus status, string? reason)
    {
        Status = status;
        RejectReason = reason;
        UpdatedAt = DateTimeOffset.UtcNow;
        StatusHistory.Add(new StatusHistoryEntry(status, UpdatedAt, reason));
    }
}
