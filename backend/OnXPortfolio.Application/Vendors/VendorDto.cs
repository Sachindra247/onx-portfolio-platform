namespace OnXPortfolio.Application.Vendors;

public sealed class VendorDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public bool IsActive { get; init; }
}