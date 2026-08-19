using System.ComponentModel.DataAnnotations;
using OnXPortfolio.Domain.Certifications;

namespace OnXPortfolio.Application.Certifications;

public sealed class CreateCertificationRequest
{
    /*
     * Existing Certification directory record,
     * when one was selected from autocomplete.
     */
    public Guid? CertificationPersonId {
        get;
        set;
    }

    /*
     * Existing ApplicationUser selected from
     * autocomplete when no CertificationPerson
     * record exists yet.
     */
    public Guid? PersonApplicationUserId {
        get;
        set;
    }

    [Required]
    [StringLength(200)]
    public string PersonName { get; set; } =
        string.Empty;

    [EmailAddress]
    [StringLength(320)]
    public string? PersonEmail { get; set; }

    public Guid? ManagerCertificationPersonId {
        get;
        set;
    }

    public Guid? ManagerApplicationUserId {
        get;
        set;
    }

    [StringLength(200)]
    public string? ManagerName { get; set; }

    [EmailAddress]
    [StringLength(320)]
    public string? ManagerEmail { get; set; }

    [Required]
    [StringLength(400)]
    public string CertificationName { get; set; } =
        string.Empty;

    [Required]
    public CertificationStatus Status { get; set; } =
        CertificationStatus.Complete;

    public DateOnly? DateCompleted { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    [StringLength(300)]
    public string? PracticeLead { get; set; }

    [StringLength(500)]
    public string? RebateImpact { get; set; }

    [StringLength(3000)]
    public string? Notes { get; set; }

    [Required]
    public Guid VendorId { get; set; }
}