using System.ComponentModel.DataAnnotations;

namespace OnXPortfolio.Application.Vendors;

public sealed class CreateVendorRequest
{
    [Required]
    [StringLength(
        200,
        MinimumLength = 2)]
    public string Name { get; init; } =
        string.Empty;
}