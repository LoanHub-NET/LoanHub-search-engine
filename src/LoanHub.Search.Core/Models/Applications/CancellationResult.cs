namespace LoanHub.Search.Core.Models.Applications;

public sealed record CancellationResult(
    CancellationOutcome Outcome,
    LoanApplication? Application,
    string Message);
