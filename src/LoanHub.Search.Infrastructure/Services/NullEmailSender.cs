using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Notifications;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class NullEmailSender : IEmailSender
{
    public Task SendAsync(EmailMessage message, CancellationToken ct) => Task.CompletedTask;
}
