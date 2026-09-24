using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Application.Email;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Infrastructure.Persistence;
using Microsoft.Extensions.Options;

using OnXPortfolio.Application.Certifications;

namespace OnXPortfolio.Infrastructure.Certifications;

public sealed class CertificationReminderDeliveryProcessor
{
    private readonly AppDbContext _dbContext;
private readonly IEmailSender _emailSender;
private readonly CertificationReminderOptions
    _options;

public CertificationReminderDeliveryProcessor(
    AppDbContext dbContext,
    IEmailSender emailSender,
    IOptions<CertificationReminderOptions> options)
{
    _dbContext = dbContext;
    _emailSender = emailSender;
    _options = options.Value;
}

    public async Task<int> SendPendingRemindersAsync(
    DateOnly processingDate,
    CancellationToken cancellationToken = default)
    {
        var pendingReminders =
            await _dbContext.CertificationReminderLogs
                .Include(reminder =>
                    reminder.Certification)
                .Where(reminder =>
    reminder.Status ==
        CertificationReminderStatus.Pending &&
    reminder.ExpiryDate.AddDays(
        -reminder.ReminderDays) ==
        processingDate)
                .OrderBy(reminder =>
                    reminder.ExpiryDate)
                .ToListAsync(cancellationToken);

        var sentCount = 0;

        foreach (var reminder in pendingReminders)
        {
            try
            {
                var subject =
                    BuildSubject(reminder);

                var body =
                    BuildBody(reminder);

                await _emailSender.SendAsync(
                    reminder.RecipientEmail,
                    subject,
                    body,
                    cancellationToken);

                reminder.Status =
                    CertificationReminderStatus.Sent;

                reminder.SentAtUtc =
                    DateTimeOffset.UtcNow;

                reminder.FailureReason = null;

                sentCount++;
            }
            catch (Exception exception)
            {
                reminder.Status =
                    CertificationReminderStatus.Failed;

                reminder.SentAtUtc = null;

                reminder.FailureReason =
                    TruncateFailureReason(
                        exception.Message);
            }
        }

        if (pendingReminders.Count > 0)
        {
            await _dbContext.SaveChangesAsync(
                cancellationToken);
        }

        return sentCount;
    }

    private string BuildSubject(
    CertificationReminderLog reminder)
{
    return _options.SubjectTemplate
        .Replace(
            "{CertificationName}",
            reminder.Certification.CertificationName);
}

    private string BuildBody(
    CertificationReminderLog reminder)
{
    return _options.BodyTemplate
        .Replace(
            "{CertificationName}",
            reminder.Certification.CertificationName)
        .Replace(
            "{ExpiryDate}",
            reminder.ExpiryDate.ToString(
                "MMMM d, yyyy"))
        .Replace(
            "{ReminderDays}",
            reminder.ReminderDays.ToString());
}

    private static string TruncateFailureReason(
        string message)
    {
        const int maximumLength = 2000;

        return message.Length <= maximumLength
            ? message
            : message[..maximumLength];
    }
}