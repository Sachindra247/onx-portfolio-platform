namespace OnXPortfolio.Application.Events;

public sealed class PublicEventRegistrationDto
{

    public Guid Id { get; init; }
    public string Description { get; init; } =
        string.Empty;

    public DateOnly? EventDate { get; init; }

    public TimeOnly? StartTime { get; init; }

    public TimeOnly? EndTime { get; init; }

    public string? TimeZoneId { get; init; }

    public string? Venue { get; init; }

    public string VendorName { get; init; } =
        string.Empty;
}