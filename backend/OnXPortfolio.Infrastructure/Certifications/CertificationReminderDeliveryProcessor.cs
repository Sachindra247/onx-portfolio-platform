using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Application.Email;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Infrastructure.Certifications;

public sealed class CertificationReminderDeliveryProcessor
{
    private readonly AppDbContext _dbContext;
    private readonly IEmailSender _emailSender;

    public CertificationReminderDeliveryProcessor(
        AppDbContext dbContext,
        IEmailSender emailSender)
    {
        _dbContext = dbContext;
        _emailSender = emailSender;
    }

    public async Task<int> SendPendingRemindersAsync(
        CancellationToken cancellationToken = default)
    {
        var pendingReminders =
            await _dbContext.CertificationReminderLogs
                .Include(reminder =>
                    reminder.Certification)
                .Where(reminder =>
                    reminder.Status ==
                        CertificationReminderStatus.Pending)
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

    private static string BuildSubject(
        CertificationReminderLog reminder)
    {
        return
            $"Certification expiry reminder: " +
            $"{reminder.Certification.CertificationName}";
    }

    private static string BuildBody(
        CertificationReminderLog reminder)
    {
        return
            $"Your certification " +
            $"\"{reminder.Certification.CertificationName}\" " +
            $"is scheduled to expire on " +
            $"{reminder.ExpiryDate:MMMM d, yyyy}. " +
            $"This reminder is being sent " +
            $"{reminder.ReminderDays} day(s) before expiry.";
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