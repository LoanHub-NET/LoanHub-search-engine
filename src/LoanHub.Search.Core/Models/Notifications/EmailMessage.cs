namespace LoanHub.Search.Core.Models.Notifications;

public sealed record EmailMessage(
    string To,
    string Subject,
    string PlainTextBody,
    string? HtmlBody = null,
    IReadOnlyList<EmailAttachment>? Attachments = null);
