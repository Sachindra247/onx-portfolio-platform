using System.ComponentModel.DataAnnotations;
using OnXPortfolio.Domain.Vacations;

namespace OnXPortfolio.Application.Vacations;

public sealed class CreateLeaveRequestRequest
{
    public LeaveType LeaveType { get; set; } =
        LeaveType.Vacation;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}