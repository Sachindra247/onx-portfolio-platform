namespace OnXPortfolio.Application.Events;

public sealed class EventRegistrationLinkDto
{
    public Guid EventId { get; init; }

    public string Token { get; init; } =
        string.Empty;
}