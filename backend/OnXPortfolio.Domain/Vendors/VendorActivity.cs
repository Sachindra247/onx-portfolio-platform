using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Domain.Vendors;

public sealed class VendorActivity : AuditableEntity
{
    public Guid VendorId { get; set; }

    public Vendor Vendor { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public DateOnly ActivityDate { get; set; }

    public string Notes { get; set; } = string.Empty;

    public Guid CreatedByUserId { get; set; }

    public ApplicationUser CreatedByUser { get; set; } = null!;
}
