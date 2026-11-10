
using System.ComponentModel.DataAnnotations;

namespace OnXPortfolio.Application.Vendors;

public sealed class CreateVendorContactRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(150)]
    public string? JobTitle { get; set; }

    [EmailAddress]
    [StringLength(254)]
    public string? Email { get; set; }

    [StringLength(50)]
    public string? Phone { get; set; }
}
