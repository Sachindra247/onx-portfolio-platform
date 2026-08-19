using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Domain.Certifications;

public sealed class Certification : AuditableEntity
{
    /*
     * Retained for compatibility with existing
     * certification/import data.
     *
     * New and edited certifications will also
     * link to CertificationPerson.
     */
    public string PersonName { get; set; } =
        string.Empty;

    public Guid? CertificationPersonId {
        get;
        set;
    }

    public CertificationPerson?
        CertificationPerson {
            get;
            set;
        }

    public string CertificationName { get; set; } =
        string.Empty;

    public CertificationStatus Status { get; set; } =
        CertificationStatus.Complete;

    public DateOnly? DateCompleted { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public string? PracticeLead { get; set; }

    public string? RebateImpact { get; set; }

    public string? Notes { get; set; }

    public Guid VendorId { get; set; }

    public Vendor Vendor { get; set; } =
        null!;
}