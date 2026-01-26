namespace LoanHub.Search.Infrastructure.Services;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

public sealed class LocalFileContractStorage : IContractStorage
{
    private readonly string _basePath;
    private readonly ILogger<LocalFileContractStorage> _logger;

    public LocalFileContractStorage(
        IOptions<ContractStorageOptions> options,
        ILogger<LocalFileContractStorage> logger)
    {
        _logger = logger;
        var containerName = string.IsNullOrWhiteSpace(options.Value.ContainerName)
            ? "signed-contracts"
            : options.Value.ContainerName;
        _basePath = Path.Combine(AppContext.BaseDirectory, containerName);
        Directory.CreateDirectory(_basePath);
        _logger.LogWarning(
            "Contract storage is using local file system at {BasePath} because Azure connection string is not configured.",
            _basePath);
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
        var targetPath = Path.Combine(_basePath, blobName.Replace('/', Path.DirectorySeparatorChar));
        var directory = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await using (var output = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await content.CopyToAsync(output, ct);
        }

        return new StoredContract(blobName, safeFileName, string.IsNullOrWhiteSpace(contentType)
            ? "application/octet-stream"
            : contentType);
    }
}
