using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Application.Vendors;

public sealed class VendorComplianceRequirementDto
{
    public Guid Id { get; set; }

    public Guid VendorId { get; set; }

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

    public decimal? AchievementPercentage { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }
}