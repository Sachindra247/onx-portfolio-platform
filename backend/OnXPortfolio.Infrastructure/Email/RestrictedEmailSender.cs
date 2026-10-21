
using OnXPortfolio.Application.Email;

namespace OnXPortfolio.Infrastructure.Email;

public sealed class RestrictedEmailSender : IEmailSender
{
    private readonly MicrosoftGraphEmailSender _graphSender;
    private readonly HashSet<string> _allowedRecipients;

    public RestrictedEmailSender(
        MicrosoftGraphEmailSender graphSender,
        IEnumerable<string> allowedRecipients)
    {
        _graphSender = graphSender;

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

        return _graphSender.SendAsync(
            recipientEmail.Trim(),
            subject,
            body,
            cancellationToken);
    }
}
