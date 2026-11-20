namespace OnXPortfolio.Application.Vendors;

public sealed class VendorActivityDto
{
    public Guid Id { get; set; }

    public Guid VendorId { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateOnly ActivityDate { get; set; }

    public string Notes { get; set; } = string.Empty;

    public Guid CreatedByUserId { get; set; }

    public string CreatedByName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }
}