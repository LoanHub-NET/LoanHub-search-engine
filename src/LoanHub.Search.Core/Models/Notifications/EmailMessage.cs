namespace LoanHub.Search.Core.Models.Notifications;

public sealed record EmailMessage(string To, string Subject, string PlainTextBody);
