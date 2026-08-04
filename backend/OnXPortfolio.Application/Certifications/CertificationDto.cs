using OnXPortfolio.Domain.Certifications;

namespace OnXPortfolio.Application.Certifications;

public sealed class CertificationDto
{
    public Guid Id { get; set; }

    public string PersonName { get; set; } = string.Empty;

    public string CertificationName { get; set; } = string.Empty;

    public CertificationStatus Status { get; set; }

    public DateOnly? DateCompleted { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public string? PracticeLead { get; set; }

    public string? RebateImpact { get; set; }

    public string? Notes { get; set; }

    public Guid VendorId { get; set; }

    public string VendorName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }
}