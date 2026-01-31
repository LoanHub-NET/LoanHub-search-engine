namespace LoanHub.Search.Core.Abstractions.Applications;

public interface IContractLinkGenerator
{
    string GetContractLink(Guid applicationId);
}
