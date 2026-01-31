namespace LoanHub.Search.Core.Abstractions.Notifications;

public interface IEmailTemplateRenderer
{
    string Render(string template, IReadOnlyDictionary<string, string> tokens);
}
