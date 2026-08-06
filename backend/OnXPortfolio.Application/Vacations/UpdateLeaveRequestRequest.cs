using System.ComponentModel.DataAnnotations;
using OnXPortfolio.Domain.Vacations;

namespace OnXPortfolio.Application.Vacations;

public sealed class UpdateLeaveRequestRequest
{
    [Required]
    [MaxLength(150)]
    public string EmployeeName { get; set; } =
        string.Empty;

    public LeaveType LeaveType { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public LeaveRequestStatus Status { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    [MaxLength(150)]
    public string? ApproverName { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}