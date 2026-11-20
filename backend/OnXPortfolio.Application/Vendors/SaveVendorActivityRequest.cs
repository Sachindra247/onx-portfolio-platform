using System.ComponentModel.DataAnnotations;

namespace OnXPortfolio.Application.Vendors;

public sealed class SaveVendorActivityRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public DateOnly? ActivityDate { get; set; }

    [Required]
    [MaxLength(10000)]
    public string Notes { get; set; } = string.Empty;
}