namespace LoanHub.Search.Core.Abstractions.Notifications;

public interface IProviderContactResolver
{
    string? GetContactEmail(string provider);
}
