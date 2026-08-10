using Microsoft.EntityFrameworkCore;

namespace OnXPortfolio.Infrastructure.Persistence;

public static class VacationUserLinkSeeder
{
    public static async Task SeedAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        var users = await dbContext.ApplicationUsers
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var usersByName = users
            .GroupBy(
                user =>
                    $"{user.FirstName} {user.LastName}".Trim(),
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First(),
                StringComparer.OrdinalIgnoreCase);

        var leaveRequests =
            await dbContext.LeaveRequests
                .Where(request =>
                    request.EmployeeUserId == null)
                .ToListAsync(cancellationToken);

        var changed = false;

        foreach (var request in leaveRequests)
        {
            if (!usersByName.TryGetValue(
                    request.EmployeeName.Trim(),
                    out var user))
            {
                continue;
            }

            request.EmployeeUserId = user.Id;
            request.UpdatedAtUtc =
                DateTimeOffset.UtcNow;

            changed = true;
        }

        if (changed)
        {
            await dbContext.SaveChangesAsync(
                cancellationToken);
        }
    }
}