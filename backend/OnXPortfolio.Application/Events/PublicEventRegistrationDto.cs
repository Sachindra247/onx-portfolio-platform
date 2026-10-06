namespace OnXPortfolio.Application.Events;

public sealed class PublicEventRegistrationDto
{
    public string Description { get; init; } =
        string.Empty;

    public DateOnly? EventDate { get; init; }

    public string? Venue { get; init; }

    public string VendorName { get; init; } =
        string.Empty;
}