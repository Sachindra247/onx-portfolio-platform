using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Events;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Domain.Rebates;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Domain.Vendors;

public sealed class Vendor : AuditableEntity
{
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    // Partnership information
public string? PartnershipTier { get; set; }

public string? PartnershipStatus { get; set; }

public Guid? PrimaryPartnerManagerId { get; set; }

public ApplicationUser? PrimaryPartnerManager { get; set; }

public string? PartnershipBenefits { get; set; }

public string? PartnerPrograms { get; set; }


// Structured vendor benefits
public decimal? DiscountPercentage { get; set; }

public decimal? RebatePercentage { get; set; }

public bool? DealRegistrationAvailable { get; set; }

public string? DealRegistrationConditions { get; set; }

public bool? SpiffAvailable { get; set; }



public ICollection<VendorContact> Contacts { get; set; } =
    new List<VendorContact>();


    public ICollection<Event> Events { get; set; } =
        new List<Event>();

    public ICollection<Certification> Certifications { get; set; } =
        [];

    public ICollection<Rebate> Rebates { get; set; } =
        [];
}