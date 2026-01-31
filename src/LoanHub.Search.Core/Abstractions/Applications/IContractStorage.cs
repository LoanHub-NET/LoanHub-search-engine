namespace LoanHub.Search.Core.Abstractions.Applications;

using LoanHub.Search.Core.Models.Applications;

public interface IContractStorage
{
    Task<StoredContract> UploadSignedContractAsync(
        Guid applicationId,
        Stream content,
        string fileName,
        string? contentType,
        CancellationToken ct);
}
