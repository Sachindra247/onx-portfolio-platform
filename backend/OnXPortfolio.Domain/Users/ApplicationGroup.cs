using OnXPortfolio.Domain.Common;

namespace OnXPortfolio.Domain.Users;

public sealed class ApplicationGroup : AuditableEntity
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<ApplicationUser> Users { get; set; } =
        new List<ApplicationUser>();
}