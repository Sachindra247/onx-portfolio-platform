using System.ComponentModel.DataAnnotations;

namespace OnXPortfolio.Application.Vendors;

public sealed class UpdateVendorRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } =
        string.Empty;
}