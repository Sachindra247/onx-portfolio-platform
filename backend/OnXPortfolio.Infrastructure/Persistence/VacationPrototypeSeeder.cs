using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Vacations;

namespace OnXPortfolio.Infrastructure.Persistence;

public static class VacationPrototypeSeeder
{
    public static async Task SeedAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        // Do not continuously add demo data.
        if (await dbContext.LeaveRequests.AnyAsync(
                cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;

        var requests = new[]
        {
            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Joel William",
                LeaveType = LeaveType.Vacation,
                StartDate = new DateOnly(2026, 8, 10),
                EndDate = new DateOnly(2026, 8, 14),
                Status = LeaveRequestStatus.Approved,
                Reason = "Summer vacation",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Lisa Sambleson",
                LeaveType = LeaveType.Vacation,
                StartDate = new DateOnly(2026, 8, 17),
                EndDate = new DateOnly(2026, 8, 21),
                Status = LeaveRequestStatus.Pending,
                Reason = "Planned vacation",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Marcel Morisett",
                LeaveType = LeaveType.Sick,
                StartDate = new DateOnly(2026, 8, 7),
                EndDate = new DateOnly(2026, 8, 7),
                Status = LeaveRequestStatus.Approved,
                Reason = "Sick day",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Lauren Pereira",
                LeaveType = LeaveType.Vacation,
                StartDate = new DateOnly(2026, 8, 24),
                EndDate = new DateOnly(2026, 8, 28),
                Status = LeaveRequestStatus.Approved,
                Reason = "Annual leave",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Donna Bitaxi",
                LeaveType = LeaveType.Personal,
                StartDate = new DateOnly(2026, 8, 18),
                EndDate = new DateOnly(2026, 8, 18),
                Status = LeaveRequestStatus.Pending,
                Reason = "Personal day",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Ashita Pattni",
                LeaveType = LeaveType.Parental,
                StartDate = new DateOnly(2026, 9, 1),
                EndDate = new DateOnly(2026, 9, 18),
                Status = LeaveRequestStatus.Approved,
                Reason = "Parental leave",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Sabrina Jubran",
                LeaveType = LeaveType.Vacation,
                StartDate = new DateOnly(2026, 9, 8),
                EndDate = new DateOnly(2026, 9, 11),
                Status = LeaveRequestStatus.Approved,
                Reason = "Vacation",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Raed Jabak",
                LeaveType = LeaveType.Vacation,
                StartDate = new DateOnly(2026, 8, 24),
                EndDate = new DateOnly(2026, 8, 26),
                Status = LeaveRequestStatus.Approved,
                Reason = "Vacation",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },

            new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeName = "Zach Schneider",
                LeaveType = LeaveType.Vacation,
                StartDate = new DateOnly(2026, 10, 5),
                EndDate = new DateOnly(2026, 10, 9),
                Status = LeaveRequestStatus.Pending,
                Reason = "Fall vacation",
                ApproverName = "Team Manager",
                Notes = "Beta sample record",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            }
        };

        dbContext.LeaveRequests.AddRange(requests);

        await dbContext.SaveChangesAsync(
            cancellationToken);
    }
}