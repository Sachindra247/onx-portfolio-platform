using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Infrastructure.Persistence;
using OnXPortfolio.Application.Certifications;

namespace OnXPortfolio.Infrastructure.Certifications;

public sealed class CertificationReminderProcessor
{
    private readonly AppDbContext _dbContext;

    public CertificationReminderProcessor(
        AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CertificationReminderPreviewDto>>
    PreviewRemindersAsync(
        IReadOnlyCollection<int> reminderDays,
        DateOnly today,
        CancellationToken cancellationToken = default)
{
    if (reminderDays.Count == 0)
    {
        return Array.Empty<CertificationReminderPreviewDto>();
    }

    var thresholds = reminderDays
        .Where(days => days >= 0)
        .Distinct()
        .ToArray();

    if (thresholds.Length == 0)
    {
        return Array.Empty<CertificationReminderPreviewDto>();
    }

    var maximumReminderDays = thresholds.Max();
    var latestExpiryDate = today.AddDays(
        maximumReminderDays);

    var certifications = await _dbContext.Certifications
        .AsNoTracking()
        .Include(certification =>
            certification.CertificationPerson)
        .ThenInclude(person =>
            person!.ApplicationUser)
        .Where(certification =>
            certification.Status !=
                CertificationStatus.Archived &&
            certification.ExpiryDate.HasValue &&
            certification.ExpiryDate.Value >= today &&
            certification.ExpiryDate.Value <=
                latestExpiryDate)
        .ToListAsync(cancellationToken);

    var existingReminderKeys =
        await _dbContext.CertificationReminderLogs
            .AsNoTracking()
            .Where(reminder =>
                reminder.ExpiryDate >= today &&
                reminder.ExpiryDate <= latestExpiryDate)
            .Select(reminder => new
            {
                reminder.CertificationId,
                reminder.ExpiryDate,
                reminder.ReminderDays
            })
            .ToListAsync(cancellationToken);

    var existingKeys = existingReminderKeys
        .Select(reminder =>
            BuildReminderKey(
                reminder.CertificationId,
                reminder.ExpiryDate,
                reminder.ReminderDays))
        .ToHashSet();

    var previews =
        new List<CertificationReminderPreviewDto>();

    foreach (var certification in certifications)
    {
        if (!certification.ExpiryDate.HasValue)
        {
            continue;
        }

        var expiryDate = certification.ExpiryDate.Value;
        var daysUntilExpiry =
            expiryDate.DayNumber - today.DayNumber;

        if (!thresholds.Contains(daysUntilExpiry))
        {
            continue;
        }

        var recipientEmail =
            ResolveRecipientEmail(certification);

        if (recipientEmail is null)
        {
            continue;
        }

        var reminderKey = BuildReminderKey(
            certification.Id,
            expiryDate,
            daysUntilExpiry);

        if (existingKeys.Contains(reminderKey))
        {
            continue;
        }

        previews.Add(
            new CertificationReminderPreviewDto
            {
                CertificationId = certification.Id,
                PersonName = certification.PersonName,
                CertificationName =
                    certification.CertificationName,
                RecipientEmail = recipientEmail,
                ExpiryDate = expiryDate,
                ReminderDays = daysUntilExpiry
            });
    }

    return previews
        .OrderBy(preview => preview.ExpiryDate)
        .ThenBy(preview => preview.PersonName)
        .ThenBy(preview => preview.CertificationName)
        .ToArray();
}

    public async Task<int> CreatePendingRemindersAsync(
        IReadOnlyCollection<int> reminderDays,
        DateOnly today,
        CancellationToken cancellationToken = default)
    {
        if (reminderDays.Count == 0)
        {
            return 0;
        }

        var thresholds = reminderDays
            .Where(days => days >= 0)
            .Distinct()
            .ToArray();

        if (thresholds.Length == 0)
        {
            return 0;
        }

        var maximumReminderDays = thresholds.Max();
        var latestExpiryDate = today.AddDays(
            maximumReminderDays);

        var certifications = await _dbContext.Certifications
            .AsNoTracking()
            .Include(certification =>
                certification.CertificationPerson)
            .ThenInclude(person =>
                person!.ApplicationUser)
            .Where(certification =>
                certification.Status !=
                    CertificationStatus.Archived &&
                certification.ExpiryDate.HasValue &&
                certification.ExpiryDate.Value >= today &&
                certification.ExpiryDate.Value <=
                    latestExpiryDate)
            .ToListAsync(cancellationToken);

        var existingReminderKeys =
            await _dbContext.CertificationReminderLogs
                .AsNoTracking()
                .Where(reminder =>
                    reminder.ExpiryDate >= today &&
                    reminder.ExpiryDate <=
                        latestExpiryDate)
                .Select(reminder => new
                {
                    reminder.CertificationId,
                    reminder.ExpiryDate,
                    reminder.ReminderDays
                })
                .ToListAsync(cancellationToken);

        var existingKeys = existingReminderKeys
            .Select(reminder =>
                BuildReminderKey(
                    reminder.CertificationId,
                    reminder.ExpiryDate,
                    reminder.ReminderDays))
            .ToHashSet();

        var createdCount = 0;

        foreach (var certification in certifications)
        {
            if (!certification.ExpiryDate.HasValue)
            {
                continue;
            }

            var expiryDate = certification.ExpiryDate.Value;
            var daysUntilExpiry =
                expiryDate.DayNumber - today.DayNumber;

            if (!thresholds.Contains(daysUntilExpiry))
            {
                continue;
            }

            var recipientEmail =
                ResolveRecipientEmail(certification);

            if (recipientEmail is null)
            {
                continue;
            }

            var reminderKey = BuildReminderKey(
                certification.Id,
                expiryDate,
                daysUntilExpiry);

            if (!existingKeys.Add(reminderKey))
            {
                continue;
            }

            _dbContext.CertificationReminderLogs.Add(
                new CertificationReminderLog
                {
                    CertificationId = certification.Id,
                    RecipientEmail = recipientEmail,
                    ReminderDays = daysUntilExpiry,
                    ExpiryDate = expiryDate,
                    Status =
                        CertificationReminderStatus.Pending
                });

            createdCount++;
        }

        if (createdCount > 0)
        {
            await _dbContext.SaveChangesAsync(
                cancellationToken);
        }

        return createdCount;
    }

    private static string? ResolveRecipientEmail(
        Certification certification)
    {
        var person = certification.CertificationPerson;

        if (person is null)
        {
            return null;
        }

        var applicationUserEmail =
            person.ApplicationUser?.Email?.Trim();

        if (!string.IsNullOrWhiteSpace(
                applicationUserEmail))
        {
            return applicationUserEmail;
        }

        var personEmail = person.Email?.Trim();

        return string.IsNullOrWhiteSpace(personEmail)
            ? null
            : personEmail;
    }

    private static string BuildReminderKey(
        Guid certificationId,
        DateOnly expiryDate,
        int reminderDays)
    {
        return $"{certificationId:N}|" +
               $"{expiryDate:yyyy-MM-dd}|" +
               $"{reminderDays}";
    }
}