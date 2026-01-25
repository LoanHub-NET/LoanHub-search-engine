namespace LoanHub.Search.Infrastructure.Services;

public sealed class ContractStorageOptions
{
    public string ConnectionString { get; init; } = string.Empty;
    public string ContainerName { get; init; } = "signed-contracts";
}
