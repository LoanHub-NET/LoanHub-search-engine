namespace LoanHub.Search.Core.Abstractions.Notifications;

using LoanHub.Search.Core.Models.Applications;

public interface IProviderContactResolver
{
    string? GetContactEmail(LoanApplication application);
}
