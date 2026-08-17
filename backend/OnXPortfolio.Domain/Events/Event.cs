using OnXPortfolio.Domain.Common;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Domain.Events;

public sealed class Event : AuditableEntity
{
    public string Description { get; set; } =
        string.Empty;

    public DateOnly? EventDate { get; set; }

    public EventStage Stage { get; set; } =
        EventStage.Planning;

    public string? Venue { get; set; }

    public string? BusinessPurpose { get; set; }

    public decimal BudgetCad { get; set; }

    public string? Notes { get; set; }

    public Guid VendorId { get; set; }

    public Vendor Vendor { get; set; } =
        null!;

    // -----------------------------------------
    // Approval workflow
    // -----------------------------------------

    public EventApprovalStatus ApprovalStatus {
        get;
        set;
    } = EventApprovalStatus.Pending;

    public Guid? SubmittedByUserId { get; set; }

    public ApplicationUser? SubmittedByUser {
        get;
        set;
    }

    public Guid? ReviewedByUserId { get; set; }

    public ApplicationUser? ReviewedByUser {
        get;
        set;
    }

    public DateTimeOffset? ReviewedAtUtc {
        get;
        set;
    }

    public string? ReviewNotes { get; set; }
}