using OnXPortfolio.Domain.Common;

namespace OnXPortfolio.Domain.Vendors;

public sealed class VendorComplianceRequirement : AuditableEntity
{
    public Guid VendorId { get; set; }

    public Vendor Vendor { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public VendorComplianceRequirementType RequirementType
    {
        get;
        set;
    }

    public decimal TargetValue { get; set; }

    public decimal? ActualValue { get; set; }

    public string Unit { get; set; } = string.Empty;

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public string? Notes { get; set; }
}