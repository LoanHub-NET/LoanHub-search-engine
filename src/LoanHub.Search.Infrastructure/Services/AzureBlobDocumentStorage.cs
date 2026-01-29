namespace LoanHub.Search.Infrastructure.Services;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using Microsoft.Extensions.Options;

/// <summary>
/// Azure Blob Storage implementation for user documents (ID, proof of income, etc.)
/// </summary>
public sealed class AzureBlobDocumentStorage : IDocumentStorage
{
    private readonly BlobContainerClient _container;
    private readonly string _connectionString;

    public AzureBlobDocumentStorage(IOptions<DocumentStorageOptions> options)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ConnectionString))
            throw new InvalidOperationException("DocumentStorage:ConnectionString is required.");

        if (string.IsNullOrWhiteSpace(settings.ContainerName))
            throw new InvalidOperationException("DocumentStorage:ContainerName is required.");

        _connectionString = settings.ConnectionString;
        _container = new BlobContainerClient(settings.ConnectionString, settings.ContainerName);
        _container.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<StoredDocument> UploadDocumentAsync(
        Guid applicationId,
        Stream content,
        string fileName,
        string? contentType,
        DocumentType documentType,
        DocumentSide side,
        CancellationToken ct)
    {
        var safeFileName = Path.GetFileName(fileName);
        var extension = Path.GetExtension(safeFileName);
        var typeFolder = documentType.ToString().ToLowerInvariant();
        var sideFolder = side.ToString().ToLowerInvariant();
        var blobName = $"{applicationId:N}/{typeFolder}/{sideFolder}/{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension}";
        
        var blob = _container.GetBlobClient(blobName);
        var resolvedContentType = string.IsNullOrWhiteSpace(contentType) 
            ? GetContentTypeFromExtension(extension) 
            : contentType;
        
        var headers = new BlobHttpHeaders
        {
            ContentType = resolvedContentType
        };

        var metadata = new Dictionary<string, string>
        {
            ["documentType"] = documentType.ToString(),
            ["side"] = side.ToString(),
            ["originalFileName"] = safeFileName
        };

        // Get content length before upload
        var sizeBytes = content.CanSeek ? content.Length : 0;

        await blob.UploadAsync(content, new BlobUploadOptions { HttpHeaders = headers, Metadata = metadata }, ct);

        // If we couldn't get size from stream, get it from blob properties
        if (sizeBytes == 0)
        {
            var properties = await blob.GetPropertiesAsync(cancellationToken: ct);
            sizeBytes = properties.Value.ContentLength;
        }

        return new StoredDocument(
            blobName,
            safeFileName,
            resolvedContentType,
            documentType,
            side,
            sizeBytes,
            DateTimeOffset.UtcNow
        );
    }

    public async Task<IReadOnlyList<StoredDocument>> ListDocumentsAsync(
        Guid applicationId,
        CancellationToken ct)
    {
        var prefix = $"{applicationId:N}/";
        var results = new List<StoredDocument>();

        await foreach (var blobItem in _container.GetBlobsAsync(BlobTraits.Metadata, prefix: prefix, cancellationToken: ct))
        {
            var metadata = blobItem.Metadata ?? new Dictionary<string, string>();
            var documentType = ParseDocumentType(metadata.TryGetValue("documentType", out var typeValue) ? typeValue : null);
            var side = ParseDocumentSide(metadata.TryGetValue("side", out var sideValue) ? sideValue : null);
            var originalFileName = metadata.TryGetValue("originalFileName", out var nameValue)
                ? nameValue
                : Path.GetFileName(blobItem.Name);
            var contentType = blobItem.Properties.ContentType ?? GetContentTypeFromExtension(Path.GetExtension(blobItem.Name));
            var sizeBytes = blobItem.Properties.ContentLength ?? 0;
            var uploadedAt = blobItem.Properties.CreatedOn ?? DateTimeOffset.UtcNow;

            results.Add(new StoredDocument(
                blobItem.Name,
                originalFileName,
                contentType,
                documentType,
                side,
                sizeBytes,
                uploadedAt
            ));
        }

        return results;
    }

    public async Task<IReadOnlyList<StoredDocument>> CopyDocumentsAsync(
        Guid targetApplicationId,
        IReadOnlyList<string> sourceBlobNames,
        CancellationToken ct)
    {
        var copied = new List<StoredDocument>();

        foreach (var sourceBlobName in sourceBlobNames.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var sourceBlob = _container.GetBlobClient(sourceBlobName);
            if (!await sourceBlob.ExistsAsync(ct))
                continue;

            var sourceProperties = await sourceBlob.GetPropertiesAsync(cancellationToken: ct);
            var sourceMetadata = sourceProperties.Value.Metadata ?? new Dictionary<string, string>();

            var documentType = ParseDocumentType(sourceMetadata.TryGetValue("documentType", out var typeValue) ? typeValue : null);
            var side = ParseDocumentSide(sourceMetadata.TryGetValue("side", out var sideValue) ? sideValue : null);
            var originalFileName = sourceMetadata.TryGetValue("originalFileName", out var nameValue)
                ? nameValue
                : Path.GetFileName(sourceBlobName);

            var extension = Path.GetExtension(sourceBlobName);
            var typeFolder = documentType.ToString().ToLowerInvariant();
            var sideFolder = side.ToString().ToLowerInvariant();
            var targetBlobName = $"{targetApplicationId:N}/{typeFolder}/{sideFolder}/{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension}";

            var targetBlob = _container.GetBlobClient(targetBlobName);
            await targetBlob.StartCopyFromUriAsync(sourceBlob.Uri, cancellationToken: ct);

            // Preserve metadata
            if (sourceMetadata.Count > 0)
                await targetBlob.SetMetadataAsync(sourceMetadata, cancellationToken: ct);

            copied.Add(new StoredDocument(
                targetBlobName,
                originalFileName,
                sourceProperties.Value.ContentType ?? GetContentTypeFromExtension(extension),
                documentType,
                side,
                sourceProperties.Value.ContentLength,
                DateTimeOffset.UtcNow
            ));
        }

        return copied;
    }

    public async Task<string?> GetDocumentUrlAsync(
        string blobName,
        TimeSpan validFor,
        CancellationToken ct)
    {
        var blob = _container.GetBlobClient(blobName);
        
        if (!await blob.ExistsAsync(ct))
            return null;

        // Generate SAS token
        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _container.Name,
            BlobName = blobName,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
            ExpiresOn = DateTimeOffset.UtcNow.Add(validFor)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasUri = blob.GenerateSasUri(sasBuilder);
        return sasUri.ToString();
    }

    public async Task<Stream?> DownloadDocumentAsync(
        string blobName,
        CancellationToken ct)
    {
        var blob = _container.GetBlobClient(blobName);
        
        if (!await blob.ExistsAsync(ct))
            return null;

        var response = await blob.DownloadStreamingAsync(cancellationToken: ct);
        return response.Value.Content;
    }

    public async Task<bool> DeleteDocumentAsync(
        string blobName,
        CancellationToken ct)
    {
        var blob = _container.GetBlobClient(blobName);
        var response = await blob.DeleteIfExistsAsync(cancellationToken: ct);
        return response.Value;
    }

    private static string GetContentTypeFromExtension(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => "application/octet-stream"
        };
    }

    private static DocumentType ParseDocumentType(string? value)
    {
        return Enum.TryParse<DocumentType>(value, true, out var parsed)
            ? parsed
            : DocumentType.Other;
    }

    private static DocumentSide ParseDocumentSide(string? value)
    {
        return Enum.TryParse<DocumentSide>(value, true, out var parsed)
            ? parsed
            : DocumentSide.Unknown;
    }
}
