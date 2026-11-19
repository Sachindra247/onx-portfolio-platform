
namespace OnXPortfolio.Application.Vendors;

public sealed class VendorDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public bool IsActive { get; init; }

    // Partnership information
    public string? PartnershipTier { get; init; }

    public string? PartnershipStatus { get; init; }

    public Guid? PrimaryPartnerManagerId { get; init; }

    public string? PartnershipBenefits { get; init; }

    public string? PartnerPrograms { get; init; }

    // Structured vendor benefits
    public decimal? DiscountPercentage { get; init; }

    public decimal? RebatePercentage { get; init; }

    public bool? DealRegistrationAvailable { get; init; }

    public string? DealRegistrationConditions { get; init; }

    public bool? SpiffAvailable { get; init; }
}
