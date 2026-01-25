using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Notifications;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class SendGridEmailSender : IEmailSender
{
    private readonly SendGridClient _client;
    private readonly SendGridOptions _options;

    public SendGridEmailSender(IOptions<SendGridOptions> options)
    {
        _options = options.Value;
        _client = new SendGridClient(_options.ApiKey);
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        var from = new EmailAddress(_options.FromEmail, _options.FromName);
        var to = new EmailAddress(message.To);
        var mail = MailHelper.CreateSingleEmail(from, to, message.Subject, message.PlainTextBody, null);
        await _client.SendEmailAsync(mail, ct);
    }
}
