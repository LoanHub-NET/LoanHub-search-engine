namespace LoanHub.Search.Api.Options;

public sealed class ContractLinkOptions
{
    public string BaseUrl { get; set; } = string.Empty;
    public string ContractPathTemplate { get; set; } = "/applications/{id}/contract";
}
