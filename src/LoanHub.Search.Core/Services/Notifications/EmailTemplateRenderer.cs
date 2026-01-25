namespace LoanHub.Search.Core.Services.Notifications;

using LoanHub.Search.Core.Abstractions.Notifications;

public sealed class EmailTemplateRenderer : IEmailTemplateRenderer
{
    public string Render(string template, IReadOnlyDictionary<string, string> tokens)
    {
        if (string.IsNullOrWhiteSpace(template))
            return string.Empty;

        var result = template;
        foreach (var (key, value) in tokens)
        {
            var token = $"{{{{{key}}}}}";
            result = result.Replace(token, value ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        }

        return result;
    }
}
