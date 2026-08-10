namespace OnXPortfolio.Application.Auth;

public sealed class AuthUserDto
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } =
        string.Empty;

    public string LastName { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public string Role { get; set; } =
        string.Empty;

    public string Group { get; set; } =
        string.Empty;

    public string CertificationsAccess { get; set; } =
        string.Empty;

    public string EventsAccess { get; set; } =
        string.Empty;

    public string VacationAccess { get; set; } =
        string.Empty;

    public bool IsGlobalAdministrator { get; set; }

    public Guid? ManagerId { get; set; }

    public string? ManagerName { get; set; }
}