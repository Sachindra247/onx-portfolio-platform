namespace OnXPortfolio.Application.Events;

public sealed class CreatePublicEventRegistrationRequest
{
    public string Name { get; init; } =
        string.Empty;

    public string? Title { get; init; }

public string? Organization { get; init; }

    public string Email { get; init; } =
        string.Empty;
}