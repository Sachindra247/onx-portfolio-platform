using OnXPortfolio.Application.Email;


namespace OnXPortfolio.Application.Events;

public sealed class EventRegistrationNotificationService
{
    private readonly IEmailSender _emailSender;
    private readonly string? _administratorEmail;

public EventRegistrationNotificationService(
    IEmailSender emailSender,
    string? administratorEmail = null)
{
    _emailSender = emailSender;
    _administratorEmail = administratorEmail;
}

    public async Task SendRegistrationConfirmationAsync(
    string attendeeEmail,
    string attendeeName,
    string eventName,
    DateOnly? eventDate,
    TimeOnly? startTime,
    TimeOnly? endTime,
    string? timeZoneId,
    string? venue,
    CancellationToken cancellationToken = default)
{
    var subject = $"Event Registration Confirmed: {eventName}";

    var dateText = eventDate?.ToString("MMMM d, yyyy")
        ?? "To be confirmed";

    var timeText = startTime.HasValue
        ? startTime.Value.ToString("h:mm tt")
        : "To be confirmed";

    if (endTime.HasValue)
    {
        timeText += $" - {endTime.Value:h:mm tt}";
    }

    if (!string.IsNullOrWhiteSpace(timeZoneId))
    {
        timeText += $" ({timeZoneId})";
    }

    var venueText = string.IsNullOrWhiteSpace(venue)
        ? "To be confirmed"
        : venue;

    var body = $"""
        Hello {attendeeName},

        Your registration has been confirmed.

        Event: {eventName}
        Date: {dateText}
        Time: {timeText}
        Venue: {venueText}

        Thank you,
        OnX Events Team
        """;

    await _emailSender.SendAsync(
        attendeeEmail,
        subject,
        body,
        cancellationToken);
}
    public async Task SendAdministratorNotificationAsync(
    string attendeeEmail,
    string attendeeName,
    string eventName,
    CancellationToken cancellationToken = default)
{
    if (string.IsNullOrWhiteSpace(_administratorEmail))
{
    return;
}

    var subject = $"New Event Registration: {eventName}";

    var body = $"""
        Hello,

        A new attendee has registered for an OnX event.

        Event: {eventName}
        Attendee: {attendeeName}
        Email: {attendeeEmail}

        Thank you,
        OnX Portfolio Platform
        """;

    await _emailSender.SendAsync(
        _administratorEmail,
        subject,
        body,
        cancellationToken);
}
}