using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Application.Events;

public sealed class EventRegistrationDto
{
    public Guid EventId { get; init; }

    public Guid UserId { get; init; }

    public EventRegistrationStatus Status {
        get;
        init;
    }

    public bool IsRegistered =>
        Status ==
        EventRegistrationStatus.Registered;

    public DateTimeOffset CreatedAtUtc {
        get;
        init;
    }

    public DateTimeOffset UpdatedAtUtc {
        get;
        init;
    }
}