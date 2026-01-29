namespace LoanHub.Search.Core.Models.Applications;

/// <summary>
/// Represents a stored document (ID document, proof of income, etc.)
/// </summary>
public sealed record StoredDocument(
    string BlobName,
    string OriginalFileName,
    string ContentType,
    DocumentType Type,
    DocumentSide Side,
    long SizeBytes,
    DateTimeOffset UploadedAt
);

/// <summary>
/// Types of documents that can be uploaded
/// </summary>
public enum DocumentType
{
    IdDocument = 0,
    ProofOfIncome = 1,
    ProofOfAddress = 2,
    BankStatement = 3,
    EmploymentContract = 4,
    Other = 99
}

/// <summary>
/// Side of the identity document
/// </summary>
public enum DocumentSide
{
    Front = 0,
    Back = 1,
    Unknown = 99
}
