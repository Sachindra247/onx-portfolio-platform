using OnXPortfolio.Domain.Common;

namespace OnXPortfolio.Domain.Certifications;

public sealed class CertificationReminderLog :
    AuditableEntity
{
    public Guid CertificationId { get; set; }

    public Certification Certification { get; set; } =
        null!;

    public string RecipientEmail { get; set; } =
        string.Empty;

    /*
     * Reminder threshold represented as the
     * number of days before expiry.
     *
     * This remains configurable so the final
     * reminder frequency does not have to be
     * hard-coded into the data model.
     */
    public int ReminderDays { get; set; }

    /*
     * Snapshot of the certification expiry date
     * when this reminder was generated.
     *
     * Keeping this value allows a renewed
     * certification to receive reminders for its
     * new expiry cycle without confusing them
     * with reminders for the previous expiry.
     */
    public DateOnly ExpiryDate { get; set; }

    public CertificationReminderStatus Status {
        get;
        set;
    } = CertificationReminderStatus.Pending;

    public DateTimeOffset? SentAtUtc { get; set; }

    public string? FailureReason { get; set; }
}
