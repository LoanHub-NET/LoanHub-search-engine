namespace LoanHub.Search.Core.Models.Notifications;

public sealed record EmailAttachment(
    string FileName,
    string ContentType,
    byte[] Content,
    string Disposition = "attachment",
    string? ContentId = null);
