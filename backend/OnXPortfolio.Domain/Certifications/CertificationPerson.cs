using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Domain.Certifications;

public sealed class CertificationPerson : AuditableEntity
{
    public string Name { get; set; } =
        string.Empty;

    public string? Email { get; set; }

    /*
     * Set when this directory person corresponds
     * to an actual application user.
     *
     * Manually-created Certification people do
     * NOT receive an ApplicationUser account.
     */
    public Guid? ApplicationUserId { get; set; }

    public ApplicationUser? ApplicationUser {
        get;
        set;
    }

    /*
     * Manager is another person in the
     * Certification directory.
     */
    public Guid? ManagerPersonId { get; set; }

    public CertificationPerson? ManagerPerson {
        get;
        set;
    }

    public ICollection<CertificationPerson>
        DirectReports { get; set; } =
            new List<CertificationPerson>();

    public ICollection<Certification>
        Certifications { get; set; } =
            new List<Certification>();
}