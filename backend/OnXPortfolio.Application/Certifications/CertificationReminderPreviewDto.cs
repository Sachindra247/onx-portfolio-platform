namespace OnXPortfolio.Application.Certifications;

public sealed class CertificationReminderPreviewDto
{
    public Guid CertificationId { get; set; }

    public string PersonName { get; set; } =
        string.Empty;

    public string CertificationName { get; set; } =
        string.Empty;

    public string RecipientEmail { get; set; } =
        string.Empty;

    public DateOnly ExpiryDate { get; set; }

    public int ReminderDays { get; set; }
}