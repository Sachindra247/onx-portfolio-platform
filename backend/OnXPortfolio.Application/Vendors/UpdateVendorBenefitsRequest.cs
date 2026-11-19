
using System.ComponentModel.DataAnnotations;

namespace OnXPortfolio.Application.Vendors;

public sealed class UpdateVendorBenefitsRequest
{
    [Range(typeof(decimal), "0", "100",
        ErrorMessage = "Discount percentage must be between 0 and 100.")]
    public decimal? DiscountPercentage { get; set; }

    [Range(typeof(decimal), "0", "100",
        ErrorMessage = "Rebate percentage must be between 0 and 100.")]
    public decimal? RebatePercentage { get; set; }

    public bool? DealRegistrationAvailable { get; set; }

    [MaxLength(4000)]
    public string? DealRegistrationConditions { get; set; }

    public bool? SpiffAvailable { get; set; }
}
