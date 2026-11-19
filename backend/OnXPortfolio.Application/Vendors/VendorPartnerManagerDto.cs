
namespace OnXPortfolio.Application.Vendors;

public sealed class VendorPartnerManagerDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;
}
