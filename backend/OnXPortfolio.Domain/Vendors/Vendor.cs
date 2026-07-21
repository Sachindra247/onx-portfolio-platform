using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Domain.Vendors;

public sealed class Vendor : AuditableEntity
{
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public ICollection<Event> Events { get; set; } = new List<Event>();
}