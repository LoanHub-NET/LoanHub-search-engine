namespace LoanHub.Search.Infrastructure.Services;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using Microsoft.Extensions.Options;

/// <summary>
/// Local file system implementation for document storage (development/fallback)
/// </summary>
public sealed class LocalFileDocumentStorage : IDocumentStorage
{
    private readonly string _basePath;

    public LocalFileDocumentStorage(IOptions<DocumentStorageOptions> options)
    {
        var settings = options.Value;
        _basePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "LoanHub",
            settings.ContainerName ?? "documents"
        );
        Directory.CreateDirectory(_basePath);
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
        var relativePath = Path.Combine(
            applicationId.ToString("N"),
            typeFolder,
            sideFolder,
            $"{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension}"
        );
        
        var fullPath = Path.Combine(_basePath, relativePath);
        var directory = Path.GetDirectoryName(fullPath)!;
        Directory.CreateDirectory(directory);

        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, ct);
        var sizeBytes = fileStream.Length;

        var resolvedContentType = string.IsNullOrWhiteSpace(contentType)
            ? GetContentTypeFromExtension(extension)
            : contentType;

        return new StoredDocument(
            relativePath,
            safeFileName,
            resolvedContentType,
            documentType,
            side,
            sizeBytes,
            DateTimeOffset.UtcNow
        );
    }

    public Task<IReadOnlyList<StoredDocument>> ListDocumentsAsync(
        Guid applicationId,
        CancellationToken ct)
    {
        var rootPath = Path.Combine(_basePath, applicationId.ToString("N"));
        if (!Directory.Exists(rootPath))
            return Task.FromResult<IReadOnlyList<StoredDocument>>(Array.Empty<StoredDocument>());

        var results = new List<StoredDocument>();
        foreach (var file in Directory.EnumerateFiles(rootPath, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(_basePath, file);
            var extension = Path.GetExtension(file);
            var contentType = GetContentTypeFromExtension(extension);
            var fileInfo = new FileInfo(file);

            var segments = relativePath.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var documentType = segments.Length > 1 ? ParseDocumentType(segments[1]) : DocumentType.Other;
            var side = segments.Length > 2 ? ParseDocumentSide(segments[2]) : DocumentSide.Unknown;

            results.Add(new StoredDocument(
                relativePath,
                Path.GetFileName(file),
                contentType,
                documentType,
                side,
                fileInfo.Length,
                fileInfo.CreationTimeUtc
            ));
        }

        return Task.FromResult<IReadOnlyList<StoredDocument>>(results);
    }

    public Task<string?> GetDocumentUrlAsync(
        string blobName,
        TimeSpan validFor,
        CancellationToken ct)
    {
        var fullPath = Path.Combine(_basePath, blobName);
        if (!File.Exists(fullPath))
            return Task.FromResult<string?>(null);

        // For local storage, return a file:// URL (not secure, for dev only)
        return Task.FromResult<string?>($"file://{fullPath}");
    }

    public Task<Stream?> DownloadDocumentAsync(
        string blobName,
        CancellationToken ct)
    {
        var fullPath = Path.Combine(_basePath, blobName);
        if (!File.Exists(fullPath))
            return Task.FromResult<Stream?>(null);

        return Task.FromResult<Stream?>(File.OpenRead(fullPath));
    }

    public Task<bool> DeleteDocumentAsync(
        string blobName,
        CancellationToken ct)
    {
        var fullPath = Path.Combine(_basePath, blobName);
        if (!File.Exists(fullPath))
            return Task.FromResult(false);

        File.Delete(fullPath);
        return Task.FromResult(true);
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
