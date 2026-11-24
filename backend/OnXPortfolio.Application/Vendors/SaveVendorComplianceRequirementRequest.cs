using System.ComponentModel.DataAnnotations;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Application.Vendors;

public sealed class SaveVendorComplianceRequirementRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public VendorComplianceRequirementType? RequirementType
    {
        get;
        set;
    }

    [Required]
    [Range(typeof(decimal), "0.01", "9999999999999999.99")]
    public decimal? TargetValue { get; set; }

    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal? ActualValue { get; set; }

    [Required]
    [MaxLength(50)]
    public string Unit { get; set; } = string.Empty;

    [Required]
    public DateOnly? PeriodStart { get; set; }

    [Required]
    public DateOnly? PeriodEnd { get; set; }

    [MaxLength(10000)]
    public string? Notes { get; set; }
}