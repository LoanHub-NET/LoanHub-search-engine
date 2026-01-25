using LoanHub.Search.Core.Models.Notifications;

namespace LoanHub.Search.Core.Abstractions.Notifications;

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}
