using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Domain.Rebates;

public sealed class Rebate : AuditableEntity
{
    public string Title { get; set; } =
        string.Empty;

    public string? ProgramName { get; set; }

    public string? Description { get; set; }

    public RebateStatus Status { get; set; } =
        RebateStatus.Draft;

    public decimal? EstimatedAmount { get; set; }

    public decimal? ActualAmount { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? CompletedDate { get; set; }

    public string? OwnerName { get; set; }

    public string? OwnerEmail { get; set; }

    public string? Notes { get; set; }

    public Guid VendorId { get; set; }

    public Vendor Vendor { get; set; } =
        null!;
}