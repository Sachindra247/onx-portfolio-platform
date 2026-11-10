
namespace OnXPortfolio.Application.Vendors;

public sealed class VendorContactDto
{
    public Guid Id { get; set; }

    public Guid VendorId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? JobTitle { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }
}
