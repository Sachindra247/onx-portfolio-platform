namespace OnXPortfolio.Application.Certifications;

public sealed class CertificationReminderOptions
{
    public const string SectionName =
        "CertificationReminders";

    public int[] ReminderDays { get; set; } =
        Array.Empty<int>();

    public string SubjectTemplate { get; set; } =
        "Certification expiry reminder: {CertificationName}";

    public string BodyTemplate { get; set; } =
        "Your certification \"{CertificationName}\" " +
        "is scheduled to expire on {ExpiryDate}. " +
        "This reminder is being sent " +
        "{ReminderDays} day(s) before expiry.";
}