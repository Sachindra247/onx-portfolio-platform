using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Events;
using OnXPortfolio.Domain.Vendors;
using PortfolioEvent = OnXPortfolio.Domain.Events.Event;

namespace OnXPortfolio.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.Vendors.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;

        var ciscoId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var microsoftId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var dellId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var vmwareId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var nutanixId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        var vendors = new[]
        {
            new Vendor
            {
                Id = ciscoId,
                Name = "Cisco",
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vendor
            {
                Id = microsoftId,
                Name = "Microsoft",
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vendor
            {
                Id = dellId,
                Name = "Dell Technologies",
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vendor
            {
                Id = vmwareId,
                Name = "VMware",
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new Vendor
            {
                Id = nutanixId,
                Name = "Nutanix",
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            }
        };

        var events = new[]
        {
            new PortfolioEvent
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"),
                Description = "Cisco Partner Technology Summit",
                EventDate = new DateOnly(2026, 8, 14),
                Stage = EventStage.Confirmed,
                BudgetCad = 18500.00m,
                Notes = "Partner technology event focused on networking and security.",
                VendorId = ciscoId,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new PortfolioEvent
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"),
                Description = "Microsoft Cloud Enablement Workshop",
                EventDate = new DateOnly(2026, 9, 10),
                Stage = EventStage.Planning,
                BudgetCad = 12000.00m,
                Notes = "Workshop covering Azure, data and AI solutions.",
                VendorId = microsoftId,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new PortfolioEvent
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"),
                Description = "Dell Infrastructure Modernization Session",
                EventDate = new DateOnly(2026, 10, 3),
                Stage = EventStage.Exploring,
                BudgetCad = 9500.00m,
                Notes = "Initial planning for an infrastructure modernization session.",
                VendorId = dellId,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new PortfolioEvent
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"),
                Description = "VMware Technical Roadshow",
                EventDate = new DateOnly(2026, 6, 12),
                Stage = EventStage.Completed,
                BudgetCad = 15750.00m,
                Notes = "Completed technical roadshow for customers and partners.",
                VendorId = vmwareId,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new PortfolioEvent
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5"),
                Description = "Nutanix Hybrid Cloud Seminar",
                EventDate = new DateOnly(2026, 8, 28),
                Stage = EventStage.InProgress,
                BudgetCad = 11000.00m,
                Notes = "Venue and speaker coordination are currently underway.",
                VendorId = nutanixId,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new PortfolioEvent
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6"),
                Description = "Cisco Security Executive Briefing",
                EventDate = new DateOnly(2026, 11, 18),
                Stage = EventStage.Planning,
                BudgetCad = 7250.00m,
                Notes = "Executive briefing focused on cybersecurity strategy.",
                VendorId = ciscoId,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            }
        };

        await dbContext.Vendors.AddRangeAsync(vendors, cancellationToken);
        await dbContext.Events.AddRangeAsync(events, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}