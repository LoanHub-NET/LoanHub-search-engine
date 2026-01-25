namespace LoanHub.Search.Infrastructure.Services;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using Microsoft.Extensions.Options;

public sealed class AzureBlobContractStorage : IContractStorage
{
    private readonly BlobContainerClient _container;

    public AzureBlobContractStorage(IOptions<ContractStorageOptions> options)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ConnectionString))
            throw new InvalidOperationException("ContractStorage:ConnectionString is required.");

        if (string.IsNullOrWhiteSpace(settings.ContainerName))
            throw new InvalidOperationException("ContractStorage:ContainerName is required.");

        _container = new BlobContainerClient(settings.ConnectionString, settings.ContainerName);
        _container.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<StoredContract> UploadSignedContractAsync(
        Guid applicationId,
        Stream content,
        string fileName,
        string? contentType,
        CancellationToken ct)
    {
        var safeFileName = Path.GetFileName(fileName);
        var extension = Path.GetExtension(safeFileName);
        var blobName = $"{applicationId:N}/{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension}";
        var blob = _container.GetBlobClient(blobName);
        var headers = new BlobHttpHeaders
        {
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType
        };

        await blob.UploadAsync(content, new BlobUploadOptions { HttpHeaders = headers }, ct);

        return new StoredContract(blobName, safeFileName, headers.ContentType);
    }
}
