using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OnXPortfolio.Application.Certifications;
using OnXPortfolio.Infrastructure.Certifications;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Tests.Certifications;

using OnXPortfolio.Application.Email;

using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Domain.Vendors;

public sealed class CertificationReminderProcessorTests
{
    [Fact]
    public async Task CreatePendingRemindersAsync_WithNoConfiguredReminderDays_CreatesNothing()
    {
        await using var connection =
            new SqliteConnection("Data Source=:memory:");

        await connection.OpenAsync();

        var dbOptions =
            new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(connection)
                .Options;

        await using var dbContext =
            new AppDbContext(dbOptions);

        await dbContext.Database.EnsureCreatedAsync();

        var reminderOptions =
            Options.Create(
                new CertificationReminderOptions
                {
                    ReminderDays = Array.Empty<int>()
                });

        var processor =
            new CertificationReminderProcessor(
                dbContext,
                reminderOptions);

        var createdCount =
            await processor.CreatePendingRemindersAsync(
                new DateOnly(2026, 9, 22));

        var reminderLogCount =
            await dbContext.CertificationReminderLogs
                .CountAsync();

        Assert.Equal(0, createdCount);
        Assert.Equal(0, reminderLogCount);
    }

    [Fact]
public async Task SendPendingRemindersAsync_SendsOnlyRemindersDueOnProcessingDate()
{
    await using var connection =
        new SqliteConnection("Data Source=:memory:");

    await connection.OpenAsync();

    var dbOptions =
        new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

    await using var dbContext =
        new AppDbContext(dbOptions);

    await dbContext.Database.EnsureCreatedAsync();

    var now =
        DateTimeOffset.UtcNow;

    var vendor =
        new Vendor
        {
            Id = Guid.NewGuid(),
            Name = "Reminder Test Vendor",
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

    var certification =
        new Certification
        {
            Id = Guid.NewGuid(),
            PersonName = "Reminder Test User",
            CertificationName = "Reminder Test Certification",
            Status = CertificationStatus.Complete,
            VendorId = vendor.Id,
            Vendor = vendor,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

    var processingDate =
        new DateOnly(2026, 9, 24);

    var dueReminder =
        new CertificationReminderLog
        {
            Id = Guid.NewGuid(),
            CertificationId = certification.Id,
            Certification = certification,
            RecipientEmail = "due@example.com",
            ReminderDays = 30,
            ExpiryDate = processingDate.AddDays(30),
            Status = CertificationReminderStatus.Pending,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

    var staleReminder =
        new CertificationReminderLog
        {
            Id = Guid.NewGuid(),
            CertificationId = certification.Id,
            Certification = certification,
            RecipientEmail = "stale@example.com",
            ReminderDays = 30,
            ExpiryDate = processingDate.AddDays(29),
            Status = CertificationReminderStatus.Pending,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

    dbContext.Vendors.Add(vendor);
    dbContext.Certifications.Add(certification);
    dbContext.CertificationReminderLogs.AddRange(
        dueReminder,
        staleReminder);

    await dbContext.SaveChangesAsync();

    var emailSender =
        new RecordingEmailSender();

    var reminderOptions =
        Options.Create(
            new CertificationReminderOptions());

    var processor =
        new CertificationReminderDeliveryProcessor(
            dbContext,
            emailSender,
            reminderOptions);

    var sentCount =
        await processor.SendPendingRemindersAsync(
            processingDate);

    Assert.Equal(1, sentCount);

    Assert.Single(emailSender.Recipients);
    Assert.Equal(
        "due@example.com",
        emailSender.Recipients[0]);

    Assert.Equal(
        CertificationReminderStatus.Sent,
        dueReminder.Status);

    Assert.NotNull(dueReminder.SentAtUtc);

    Assert.Equal(
        CertificationReminderStatus.Pending,
        staleReminder.Status);

    Assert.Null(staleReminder.SentAtUtc);
}

private sealed class RecordingEmailSender :
    IEmailSender
{
    public List<string> Recipients { get; } = [];

    public Task SendAsync(
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        Recipients.Add(recipientEmail);

        return Task.CompletedTask;
    }
}
}