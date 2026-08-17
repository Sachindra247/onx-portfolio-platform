using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Application.Events;

public sealed class EventDto
{
    public Guid Id { get; init; }

    public string Description { get; init; } =
        string.Empty;

    public DateOnly? EventDate { get; init; }

    public EventStage Stage { get; init; }

    public string? Venue { get; init; }

    public string? BusinessPurpose { get; init; }

    public decimal BudgetCad { get; init; }

    public string? Notes { get; init; }

    public Guid VendorId { get; init; }

    public string VendorName { get; init; } =
        string.Empty;

    public EventApprovalStatus ApprovalStatus {
        get;
        init;
    }

    public Guid? SubmittedByUserId {
        get;
        init;
    }

    public string? SubmittedByUserName {
        get;
        init;
    }

    public Guid? ReviewedByUserId {
        get;
        init;
    }

    public string? ReviewedByUserName {
        get;
        init;
    }

    public DateTimeOffset? ReviewedAtUtc {
        get;
        init;
    }

    public string? ReviewNotes {
        get;
        init;
    }

    public DateTimeOffset CreatedAtUtc {
        get;
        init;
    }

    public DateTimeOffset UpdatedAtUtc {
        get;
        init;
    }
}