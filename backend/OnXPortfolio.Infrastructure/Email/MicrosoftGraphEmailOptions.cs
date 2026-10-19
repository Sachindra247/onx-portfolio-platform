namespace OnXPortfolio.Infrastructure.Email;

public sealed class MicrosoftGraphEmailOptions
{
    public const string SectionName = "MicrosoftGraphEmail";

    public string TenantId { get; set; } = string.Empty;

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string SenderEmail { get; set; } = string.Empty;

    public void Validate()
{
    if (string.IsNullOrWhiteSpace(TenantId) ||
        string.IsNullOrWhiteSpace(ClientId) ||
        string.IsNullOrWhiteSpace(ClientSecret) ||
        string.IsNullOrWhiteSpace(SenderEmail))
    {
        throw new InvalidOperationException(
            "Microsoft Graph email configuration is incomplete.");
    }
if (!Guid.TryParse(TenantId, out _))
{
    throw new InvalidOperationException(
        "Microsoft Graph TenantId must be a valid GUID.");
}

}
}