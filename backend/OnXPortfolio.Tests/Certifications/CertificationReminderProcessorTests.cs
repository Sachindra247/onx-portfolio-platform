using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OnXPortfolio.Application.Certifications;
using OnXPortfolio.Infrastructure.Certifications;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Tests.Certifications;

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
}