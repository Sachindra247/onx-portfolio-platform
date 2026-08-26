using OnXPortfolio.Domain.Rebates;

namespace OnXPortfolio.Application.Rebates;

public sealed class RebateDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } =
        string.Empty;

    public string? ProgramName { get; set; }

    public string? Description { get; set; }

    public RebateStatus Status { get; set; }

    public decimal? EstimatedAmount { get; set; }

    public decimal? ActualAmount { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? CompletedDate { get; set; }

    public string? OwnerName { get; set; }

    public string? OwnerEmail { get; set; }

    public string? Notes { get; set; }

    public Guid VendorId { get; set; }

    public string VendorName { get; set; } =
        string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }
}