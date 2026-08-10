using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Domain.Vacations;

public sealed class LeaveRequest : AuditableEntity
{
    public string EmployeeName { get; set; } = string.Empty;

    public LeaveType LeaveType { get; set; } =
        LeaveType.Vacation;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public LeaveRequestStatus Status { get; set; } =
        LeaveRequestStatus.Pending;

    public string? Reason { get; set; }

    public string? ApproverName { get; set; }

    public string? Notes { get; set; }

    public Guid? EmployeeUserId { get; set; }

public ApplicationUser? EmployeeUser { get; set; }

public Guid? ReviewedByUserId { get; set; }

public ApplicationUser? ReviewedByUser { get; set; }

public DateTimeOffset? ReviewedAtUtc { get; set; }
}