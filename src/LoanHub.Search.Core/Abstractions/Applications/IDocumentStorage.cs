namespace LoanHub.Search.Core.Abstractions.Applications;

using LoanHub.Search.Core.Models.Applications;

/// <summary>
/// Interface for storing user documents (ID, proof of income, etc.)
/// </summary>
public interface IDocumentStorage
{
    /// <summary>
    /// Uploads a document for an application
    /// </summary>
    Task<StoredDocument> UploadDocumentAsync(
        Guid applicationId,
        Stream content,
        string fileName,
        string? contentType,
        DocumentType documentType,
        DocumentSide side,
        CancellationToken ct);

    /// <summary>
    /// Lists documents for an application
    /// </summary>
    Task<IReadOnlyList<StoredDocument>> ListDocumentsAsync(
        Guid applicationId,
        CancellationToken ct);

    /// <summary>
    /// Copies documents to a new application (reuse previously uploaded docs)
    /// </summary>
    Task<IReadOnlyList<StoredDocument>> CopyDocumentsAsync(
        Guid targetApplicationId,
        IReadOnlyList<string> sourceBlobNames,
        CancellationToken ct);

    /// <summary>
    /// Gets a document download URL (SAS URL for Azure Blob)
    /// </summary>
    Task<string?> GetDocumentUrlAsync(
        string blobName,
        TimeSpan validFor,
        CancellationToken ct);

    /// <summary>
    /// Downloads a document
    /// </summary>
    Task<Stream?> DownloadDocumentAsync(
        string blobName,
        CancellationToken ct);

    /// <summary>
    /// Deletes a document
    /// </summary>
    Task<bool> DeleteDocumentAsync(
        string blobName,
        CancellationToken ct);
}
