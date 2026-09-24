using OnXPortfolio.Infrastructure.Certifications;

namespace OnXPortfolio.Tests.Certifications;

public sealed class CertificationReminderBackgroundServiceTests
{
    [Fact]
    public void GetNextRunUtc_BeforeProcessingHour_ReturnsToday()
    {
        var now =
            new DateTimeOffset(
                2026,
                9,
                24,
                10,
                30,
                0,
                TimeSpan.Zero);

        var nextRun =
            CertificationReminderBackgroundService
                .GetNextRunUtc(
                    now,
                    13);

        var expected =
            new DateTimeOffset(
                2026,
                9,
                24,
                13,
                0,
                0,
                TimeSpan.Zero);

        Assert.Equal(expected, nextRun);
    }

    [Fact]
    public void GetNextRunUtc_AfterProcessingHour_ReturnsTomorrow()
    {
        var now =
            new DateTimeOffset(
                2026,
                9,
                24,
                14,
                30,
                0,
                TimeSpan.Zero);

        var nextRun =
            CertificationReminderBackgroundService
                .GetNextRunUtc(
                    now,
                    13);

        var expected =
            new DateTimeOffset(
                2026,
                9,
                25,
                13,
                0,
                0,
                TimeSpan.Zero);

        Assert.Equal(expected, nextRun);
    }

    [Fact]
    public void GetNextRunUtc_ClampsInvalidProcessingHour()
    {
        var now =
            new DateTimeOffset(
                2026,
                9,
                24,
                10,
                30,
                0,
                TimeSpan.Zero);

        var nextRun =
            CertificationReminderBackgroundService
                .GetNextRunUtc(
                    now,
                    30);

        var expected =
            new DateTimeOffset(
                2026,
                9,
                24,
                23,
                0,
                0,
                TimeSpan.Zero);

        Assert.Equal(expected, nextRun);
    }
}