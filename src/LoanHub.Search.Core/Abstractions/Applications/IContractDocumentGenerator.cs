namespace LoanHub.Search.Core.Abstractions.Applications;

using LoanHub.Search.Core.Models.Applications;

public interface IContractDocumentGenerator
{
    ContractDocument GeneratePreliminaryContract(LoanApplication application);
}
