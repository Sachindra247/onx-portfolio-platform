using System.ComponentModel.DataAnnotations;
using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Application.Events;

public sealed class UpdateEventRequest
{
    [Required]
    [StringLength(300, MinimumLength = 2)]
    public string Description { get; init; } = string.Empty;

    public DateOnly? EventDate { get; init; }

    public EventStage Stage { get; init; }

    [Range(typeof(decimal), "0", "999999999.99")]
    public decimal BudgetCad { get; init; }

    [StringLength(4000)]
    public string? Notes { get; init; }

    [Required]
    public Guid VendorId { get; init; }
}