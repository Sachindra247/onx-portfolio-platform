using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Domain.Events;

public sealed class Event : AuditableEntity
{
    public string Description { get; set; } = string.Empty;

    public DateOnly? EventDate { get; set; }

    public EventStage Stage { get; set; } = EventStage.Planning;

    public decimal BudgetCad { get; set; }

    public string? Notes { get; set; }

    public Guid VendorId { get; set; }

    public Vendor Vendor { get; set; } = null!;
}