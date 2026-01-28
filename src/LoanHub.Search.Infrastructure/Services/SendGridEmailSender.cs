using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Notifications;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class SendGridEmailSender : IEmailSender
{
    private readonly SendGridClient _client;
    private readonly ILogger<SendGridEmailSender> _logger;
    private readonly SendGridOptions _options;

    public SendGridEmailSender(
        IOptions<SendGridOptions> options,
        ILogger<SendGridEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
        _client = new SendGridClient(_options.ApiKey);
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        var from = new EmailAddress(_options.FromEmail, _options.FromName);
        var to = new EmailAddress(message.To);
        var mail = MailHelper.CreateSingleEmail(from, to, message.Subject, message.PlainTextBody, message.HtmlBody);

        if (message.Attachments is not null)
        {
            foreach (var attachment in message.Attachments)
            {
                var encoded = Convert.ToBase64String(attachment.Content);
                mail.AddAttachment(attachment.FileName, encoded, attachment.ContentType);
            }
        }

        var response = await _client.SendEmailAsync(mail, ct);
        if ((int)response.StatusCode >= 400)
        {
            _logger.LogError(
                "SendGrid email send failed with status {StatusCode}. Body: {ResponseBody}",
                (int)response.StatusCode,
                response.Body);
        }
    }
}
