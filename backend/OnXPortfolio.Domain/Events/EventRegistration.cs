using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Domain.Events;

public sealed class EventRegistration : AuditableEntity
{
    public Guid EventId { get; set; }

    public Event Event { get; set; } = null!;

    public Guid UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public EventRegistrationStatus Status { get; set; } =
        EventRegistrationStatus.Registered;
}