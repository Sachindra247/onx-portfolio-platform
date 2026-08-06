using OnXPortfolio.Domain.Vacations;

namespace OnXPortfolio.Application.Vacations;

public sealed class LeaveRequestDto
{
    public Guid Id { get; set; }

    public string EmployeeName { get; set; } =
        string.Empty;

    public LeaveType LeaveType { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public LeaveRequestStatus Status { get; set; }

    public string? Reason { get; set; }

    public string? ApproverName { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }
}