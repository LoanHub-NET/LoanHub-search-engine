namespace LoanHub.Search.Api.Services;

using LoanHub.Search.Api.Options;
using LoanHub.Search.Core.Abstractions.Applications;
using Microsoft.Extensions.Options;

public sealed class ContractLinkGenerator : IContractLinkGenerator
{
    private readonly ContractLinkOptions _options;

    public ContractLinkGenerator(IOptions<ContractLinkOptions> options)
    {
        _options = options.Value;
    }

    public string GetContractLink(Guid applicationId)
    {
        var baseUrl = _options.BaseUrl?.TrimEnd('/');
        var path = (_options.ContractPathTemplate ?? "/applications/{id}/contract")
            .Replace("{id}", applicationId.ToString(), StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(baseUrl))
            return path;

        if (!path.StartsWith("/", StringComparison.Ordinal))
            path = "/" + path;

        return $"{baseUrl}{path}";
    }
}
