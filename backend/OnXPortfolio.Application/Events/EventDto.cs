using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Application.Events;

public sealed class EventDto
{
    public Guid Id { get; init; }

    public string Description { get; init; } = string.Empty;

    public DateOnly? EventDate { get; init; }

    public EventStage Stage { get; init; }

    public decimal BudgetCad { get; init; }

    public string? Notes { get; init; }

    public Guid VendorId { get; init; }

    public string VendorName { get; init; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; init; }

    public DateTimeOffset UpdatedAtUtc { get; init; }
}