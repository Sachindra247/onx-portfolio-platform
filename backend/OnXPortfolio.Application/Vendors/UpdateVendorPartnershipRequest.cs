
using System;
using System.ComponentModel.DataAnnotations;

namespace OnXPortfolio.Application.Vendors;

public sealed class UpdateVendorPartnershipRequest
{
    [MaxLength(100)]
    public string? PartnershipTier { get; set; }

    [MaxLength(100)]
    public string? PartnershipStatus { get; set; }

    public Guid? PrimaryPartnerManagerId { get; set; }

    [MaxLength(4000)]
    public string? PartnershipBenefits { get; set; }

    [MaxLength(4000)]
    public string? PartnerPrograms { get; set; }
}
