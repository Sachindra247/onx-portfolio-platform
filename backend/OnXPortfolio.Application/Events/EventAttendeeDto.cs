namespace OnXPortfolio.Application.Events;

public sealed class EventAttendeeDto
{
    public Guid UserId { get; init; }

    public string Name { get; init; } =
        string.Empty;

    public string Email { get; init; } =
        string.Empty;

    public DateTimeOffset RegisteredAtUtc {
        get;
        init;
    }
}