namespace LoanHub.Search.Core.Models.Applications;

public sealed record StoredContract(
    string BlobName,
    string FileName,
    string? ContentType);
