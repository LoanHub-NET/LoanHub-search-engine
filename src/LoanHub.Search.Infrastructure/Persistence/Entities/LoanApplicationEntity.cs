namespace LoanHub.Search.Infrastructure.Persistence.Entities;

public sealed class LoanApplicationEntity
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string ApplicantEmail { get; set; } = string.Empty;
    public ApplicantDetailsEntity ApplicantDetails { get; set; } = new();
    public OfferSnapshotEntity OfferSnapshot { get; set; } = new();
    public int Status { get; set; }
    public string? RejectReason { get; set; }
    public DateTimeOffset? ContractReadyAt { get; set; }
    public string? SignedContractFileName { get; set; }
    public string? SignedContractBlobName { get; set; }
    public string? SignedContractContentType { get; set; }
    public DateTimeOffset? SignedContractReceivedAt { get; set; }
    public DateTimeOffset? FinalApprovedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<StatusHistoryEntryEntity> StatusHistory { get; set; } = new();
}
