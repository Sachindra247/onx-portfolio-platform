using Microsoft.Extensions.Logging;
using OnXPortfolio.Application.Email;

namespace OnXPortfolio.Infrastructure.Email;

public sealed class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(
        ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "EMAIL TEST ONLY - Recipient: {RecipientEmail}, " +
            "Subject: {Subject}, Body: {Body}",
            recipientEmail,
            subject,
            body);

        return Task.CompletedTask;
    }
}