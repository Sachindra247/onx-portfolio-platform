
using OnXPortfolio.Application.Email;

namespace OnXPortfolio.Infrastructure.Email;

public sealed class RestrictedEmailSender : IEmailSender
{
    private readonly IEmailSender _innerSender;
    private readonly HashSet<string> _allowedRecipients;

    public RestrictedEmailSender(
        IEmailSender innerSender,
        IEnumerable<string> allowedRecipients)
    {
        _innerSender = innerSender;

        _allowedRecipients = new HashSet<string>(
            allowedRecipients
                .Where(email => !string.IsNullOrWhiteSpace(email))
                .Select(email => email.Trim()),
            StringComparer.OrdinalIgnoreCase);
    }

    public Task SendAsync(
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail) ||
            !_allowedRecipients.Contains(recipientEmail.Trim()))
        {
            // Block delivery to recipients not explicitly approved.
            return Task.CompletedTask;
        }

        return _innerSender.SendAsync(
            recipientEmail.Trim(),
            subject,
            body,
            cancellationToken);
    }
}
