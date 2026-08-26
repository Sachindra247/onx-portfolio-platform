using System.ComponentModel.DataAnnotations;
using OnXPortfolio.Domain.Rebates;

namespace OnXPortfolio.Application.Rebates;

public sealed class UpdateRebateRequest
{
    [Required]
    [StringLength(300)]
    public string Title { get; set; } =
        string.Empty;

    [StringLength(300)]
    public string? ProgramName { get; set; }

    [StringLength(3000)]
    public string? Description { get; set; }

    [Required]
    public RebateStatus Status { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? EstimatedAmount { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? ActualAmount { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? CompletedDate { get; set; }

    [StringLength(200)]
    public string? OwnerName { get; set; }

    [EmailAddress]
    [StringLength(250)]
    public string? OwnerEmail { get; set; }

    [StringLength(3000)]
    public string? Notes { get; set; }

    [Required]
    public Guid VendorId { get; set; }
}