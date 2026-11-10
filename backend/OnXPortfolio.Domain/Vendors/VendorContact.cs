
using OnXPortfolio.Domain.Common;

namespace OnXPortfolio.Domain.Vendors;

public sealed class VendorContact : AuditableEntity
{
    public Guid VendorId { get; set; }

    public Vendor Vendor { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string? JobTitle { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }
}
