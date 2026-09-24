using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OnXPortfolio.Application.Certifications;

namespace OnXPortfolio.Infrastructure.Certifications;

public sealed class CertificationReminderBackgroundService
    : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptionsMonitor<CertificationReminderOptions>
        _options;
    private readonly ILogger<CertificationReminderBackgroundService>
        _logger;

    public CertificationReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<CertificationReminderOptions> options,
        ILogger<CertificationReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var options = _options.CurrentValue;

            if (!options.Enabled)
            {
                await Task.Delay(
                    TimeSpan.FromMinutes(5),
                    stoppingToken);

                continue;
            }

            var now = DateTimeOffset.UtcNow;

var nextRun =
    GetNextRunUtc(
        now,
        options.ProcessingHourUtc);

            var delay = nextRun - now;

            _logger.LogInformation(
                "Certification reminder processing scheduled " +
                "for {NextRunUtc}.",
                nextRun);

            await Task.Delay(
                delay,
                stoppingToken);

            await ProcessRemindersAsync(stoppingToken);
        }
    }

    internal static DateTimeOffset GetNextRunUtc(
    DateTimeOffset now,
    int processingHourUtc)
{
    var processingHour =
        Math.Clamp(processingHourUtc, 0, 23);

    var scheduledToday =
        new DateTimeOffset(
            now.Year,
            now.Month,
            now.Day,
            processingHour,
            0,
            0,
            TimeSpan.Zero);

    return scheduledToday > now
        ? scheduledToday
        : scheduledToday.AddDays(1);
}

    private async Task ProcessRemindersAsync(
        CancellationToken cancellationToken)
    {
        var options = _options.CurrentValue;

        if (!options.Enabled ||
            options.ReminderDays.Length == 0)
        {
            return;
        }

        try
        {
            using var scope =
                _scopeFactory.CreateScope();

            var reminderProcessor =
                scope.ServiceProvider
                    .GetRequiredService<
                        CertificationReminderProcessor>();

            var deliveryProcessor =
                scope.ServiceProvider
                    .GetRequiredService<
                        CertificationReminderDeliveryProcessor>();

            var today =
                DateOnly.FromDateTime(
                    DateTime.UtcNow);

            var createdCount =
                await reminderProcessor
                    .CreatePendingRemindersAsync(
                        today,
                        cancellationToken);

            var sentCount =
    await deliveryProcessor
        .SendPendingRemindersAsync(
            today,
            cancellationToken);

            _logger.LogInformation(
                "Certification reminder processing completed. " +
                "Created {CreatedCount}; sent {SentCount}.",
                createdCount,
                sentCount);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Certification reminder processing failed.");
        }
    }
}