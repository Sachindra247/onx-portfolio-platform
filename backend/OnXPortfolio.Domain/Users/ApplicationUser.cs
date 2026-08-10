using OnXPortfolio.Domain.Common;

namespace OnXPortfolio.Domain.Users;

public sealed class ApplicationUser : AuditableEntity
{
    public string FirstName { get; set; } =
        string.Empty;

    public string LastName { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public UserRole Role { get; set; } =
        UserRole.Member;

    public ModuleAccess CertificationsAccess { get; set; } =
        ModuleAccess.User;

    public ModuleAccess EventsAccess { get; set; } =
        ModuleAccess.User;

    public ModuleAccess VacationAccess { get; set; } =
        ModuleAccess.User;

    public bool IsGlobalAdministrator { get; set; }

    public bool IsActive { get; set; } = true;

    // Used only for the temporary beta authentication.
    // Entra will replace the login mechanism later.
    public string? PasswordHash { get; set; }

    public bool LoginEnabled { get; set; }

    public Guid GroupId { get; set; }

    public ApplicationGroup Group { get; set; } =
        null!;

    public Guid? ManagerId { get; set; }

    public ApplicationUser? Manager { get; set; }

    public ICollection<ApplicationUser> DirectReports { get; set; } =
        new List<ApplicationUser>();
}