namespace LoanHub.Search.Core.Models.Applications;

public enum ApplicationStatus
{
    New = 1,
    PreliminarilyAccepted = 2,
    Accepted = 3,
    Rejected = 4,
    Cancelled = 5,
    Granted = 6,
    ContractReady = 7,
    SignedContractUploaded = 8,
    FinalApproved = 9
}
