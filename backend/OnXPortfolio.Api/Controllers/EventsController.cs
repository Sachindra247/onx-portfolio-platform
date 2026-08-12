using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Events;
using OnXPortfolio.Domain.Events;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Infrastructure.Persistence;
using PortfolioEvent = OnXPortfolio.Domain.Events.Event;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/events")]
public sealed class EventsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly CurrentUserService _currentUserService;

    public EventsController(
        AppDbContext dbContext,
        CurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    // =========================================================
    // GET ALL
    // Normal users see approved events only.
    // Events Admins and Global Admins can see all events.
    // =========================================================

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<EventDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetEvents(
        [FromQuery] string? search,
        [FromQuery] EventStage? stage,
        [FromQuery] Guid? vendorId,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var query = _dbContext.Events
            .AsNoTracking()
            .AsQueryable();

        // Normal users should only see events
        // that have been approved.
        if (!CanManageEvents(currentUser))
        {
            query = query.Where(portfolioEvent =>
                portfolioEvent.ApprovalStatus ==
                    EventApprovalStatus.Approved);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch =
                search.Trim();

            query = query.Where(portfolioEvent =>
                portfolioEvent.Description.Contains(
                    normalizedSearch) ||
                (
                    portfolioEvent.Notes != null &&
                    portfolioEvent.Notes.Contains(
                        normalizedSearch)
                ) ||
                portfolioEvent.Vendor.Name.Contains(
                    normalizedSearch));
        }

        if (stage.HasValue)
        {
            query = query.Where(portfolioEvent =>
                portfolioEvent.Stage ==
                    stage.Value);
        }

        if (vendorId.HasValue)
        {
            query = query.Where(portfolioEvent =>
                portfolioEvent.VendorId ==
                    vendorId.Value);
        }

        var events = await query
            .OrderBy(portfolioEvent =>
                portfolioEvent.EventDate == null)
            .ThenBy(portfolioEvent =>
                portfolioEvent.EventDate)
            .ThenBy(portfolioEvent =>
                portfolioEvent.Description)
            .Select(portfolioEvent =>
                new EventDto
                {
                    Id =
                        portfolioEvent.Id,

                    Description =
                        portfolioEvent.Description,

                    EventDate =
                        portfolioEvent.EventDate,

                    Stage =
                        portfolioEvent.Stage,

                    BudgetCad =
                        portfolioEvent.BudgetCad,

                    Notes =
                        portfolioEvent.Notes,

                    VendorId =
                        portfolioEvent.VendorId,

                    VendorName =
                        portfolioEvent.Vendor.Name,

                    ApprovalStatus =
                        portfolioEvent.ApprovalStatus,

                    SubmittedByUserId =
                        portfolioEvent.SubmittedByUserId,

                    SubmittedByUserName =
                        portfolioEvent.SubmittedByUser == null
                            ? null
                            : portfolioEvent.SubmittedByUser.FirstName +
                              " " +
                              portfolioEvent.SubmittedByUser.LastName,

                    ReviewedByUserId =
                        portfolioEvent.ReviewedByUserId,

                    ReviewedByUserName =
                        portfolioEvent.ReviewedByUser == null
                            ? null
                            : portfolioEvent.ReviewedByUser.FirstName +
                              " " +
                              portfolioEvent.ReviewedByUser.LastName,

                    ReviewedAtUtc =
                        portfolioEvent.ReviewedAtUtc,

                    ReviewNotes =
                        portfolioEvent.ReviewNotes,

                    CreatedAtUtc =
                        portfolioEvent.CreatedAtUtc,

                    UpdatedAtUtc =
                        portfolioEvent.UpdatedAtUtc
                })
            .ToListAsync(
                cancellationToken);

        return Ok(events);
    }

    // =========================================================
    // GET ONE
    // Normal users may only retrieve approved events.
    // =========================================================

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(EventDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> GetEvent(
        Guid id,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var portfolioEvent =
            await _dbContext.Events
                .AsNoTracking()
                .Include(eventRecord =>
                    eventRecord.Vendor)
                .Include(eventRecord =>
                    eventRecord.SubmittedByUser)
                .Include(eventRecord =>
                    eventRecord.ReviewedByUser)
                .SingleOrDefaultAsync(
                    eventRecord =>
                        eventRecord.Id == id,
                    cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        if (
            !CanManageEvents(currentUser) &&
            portfolioEvent.ApprovalStatus !=
                EventApprovalStatus.Approved)
        {
            return Forbid();
        }

        return Ok(
            MapToDto(portfolioEvent));
    }

    // =========================================================
    // CREATE
    // Events Admin / Global Admin only.
    // New events always enter Pending approval.
    // =========================================================

    [HttpPost]
    [ProducesResponseType(
        typeof(EventDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EventDto>> CreateEvent(
        CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageEvents(currentUser))
        {
            return Forbid();
        }

        var vendorExists =
            await _dbContext.Vendors
                .AnyAsync(
                    vendor =>
                        vendor.Id ==
                            request.VendorId &&
                        vendor.IsActive,
                    cancellationToken);

        if (!vendorExists)
        {
            ModelState.AddModelError(
                nameof(request.VendorId),
                "The selected vendor does not exist or is inactive.");

            return ValidationProblem(
                ModelState);
        }

        var now =
            DateTimeOffset.UtcNow;

        var portfolioEvent =
            new PortfolioEvent
            {
                Id =
                    Guid.NewGuid(),

                Description =
                    request.Description.Trim(),

                EventDate =
                    request.EventDate,

                Stage =
                    request.Stage,

                BudgetCad =
                    request.BudgetCad,

                Notes =
                    NormalizeOptionalText(
                        request.Notes),

                VendorId =
                    request.VendorId,

                ApprovalStatus =
                    EventApprovalStatus.Pending,

                SubmittedByUserId =
                    currentUser.Id,

                ReviewedByUserId =
                    null,

                ReviewedAtUtc =
                    null,

                ReviewNotes =
                    null,

                CreatedAtUtc =
                    now,

                UpdatedAtUtc =
                    now
            };

        _dbContext.Events.Add(
            portfolioEvent);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var createdEvent =
            await GetEventDtoAsync(
                portfolioEvent.Id,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetEvent),
            new
            {
                id = portfolioEvent.Id
            },
            createdEvent);
    }

    // =========================================================
    // UPDATE
    // Events Admin / Global Admin only.
    //
    // Any meaningful edit sends the event back to Pending
    // so the updated version can be reviewed again.
    // =========================================================

    [HttpPut("{id:guid}")]
    [ProducesResponseType(
        typeof(EventDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> UpdateEvent(
        Guid id,
        UpdateEventRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageEvents(currentUser))
        {
            return Forbid();
        }

        var portfolioEvent =
            await _dbContext.Events
                .SingleOrDefaultAsync(
                    eventRecord =>
                        eventRecord.Id == id,
                    cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        var vendorExists =
            await _dbContext.Vendors
                .AnyAsync(
                    vendor =>
                        vendor.Id ==
                            request.VendorId &&
                        vendor.IsActive,
                    cancellationToken);

        if (!vendorExists)
        {
            ModelState.AddModelError(
                nameof(request.VendorId),
                "The selected vendor does not exist or is inactive.");

            return ValidationProblem(
                ModelState);
        }

        portfolioEvent.Description =
            request.Description.Trim();

        portfolioEvent.EventDate =
            request.EventDate;

        portfolioEvent.Stage =
            request.Stage;

        portfolioEvent.BudgetCad =
            request.BudgetCad;

        portfolioEvent.Notes =
            NormalizeOptionalText(
                request.Notes);

        portfolioEvent.VendorId =
            request.VendorId;

        // Re-submit the updated event
        // through the approval workflow.
        portfolioEvent.ApprovalStatus =
            EventApprovalStatus.Pending;

        portfolioEvent.SubmittedByUserId =
            currentUser.Id;

        portfolioEvent.ReviewedByUserId =
            null;

        portfolioEvent.ReviewedAtUtc =
            null;

        portfolioEvent.ReviewNotes =
            null;

        portfolioEvent.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var updatedEvent =
            await GetEventDtoAsync(
                id,
                cancellationToken);

        return Ok(updatedEvent);
    }

    // =========================================================
    // DELETE
    // Events Admin / Global Admin only.
    // =========================================================

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEvent(
        Guid id,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageEvents(currentUser))
        {
            return Forbid();
        }

        var portfolioEvent =
            await _dbContext.Events
                .SingleOrDefaultAsync(
                    eventRecord =>
                        eventRecord.Id == id,
                    cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        _dbContext.Events.Remove(
            portfolioEvent);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return NoContent();
    }

    // =========================================================
    // APPROVE
    // Global Admin only.
    // =========================================================

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(
        typeof(EventDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> ApproveEvent(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await ReviewEvent(
            id,
            EventApprovalStatus.Approved,
            cancellationToken);
    }

    // =========================================================
    // REJECT
    // Global Admin only.
    // =========================================================

    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(
        typeof(EventDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> RejectEvent(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await ReviewEvent(
            id,
            EventApprovalStatus.Rejected,
            cancellationToken);
    }

    // =========================================================
    // REVIEW INTERNAL
    // =========================================================

    private async Task<ActionResult<EventDto>> ReviewEvent(
        Guid id,
        EventApprovalStatus newStatus,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        // Only Global Site Administrators
        // can approve or reject events.
        if (!currentUser.IsGlobalAdministrator)
        {
            return Forbid();
        }

        var portfolioEvent =
            await _dbContext.Events
                .SingleOrDefaultAsync(
                    eventRecord =>
                        eventRecord.Id == id,
                    cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        if (
            portfolioEvent.ApprovalStatus !=
                EventApprovalStatus.Pending)
        {
            return BadRequest(
                new
                {
                    message =
                        "Only pending events can be reviewed."
                });
        }

        var now =
            DateTimeOffset.UtcNow;

        portfolioEvent.ApprovalStatus =
            newStatus;

        portfolioEvent.ReviewedByUserId =
            currentUser.Id;

        portfolioEvent.ReviewedAtUtc =
            now;

        portfolioEvent.UpdatedAtUtc =
            now;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var reviewedEvent =
            await GetEventDtoAsync(
                id,
                cancellationToken);

        return Ok(reviewedEvent);
    }

    // =========================================================
    // AUTHORIZATION
    // =========================================================

    private static bool CanManageEvents(
        ApplicationUser user)
    {
        return
            user.IsGlobalAdministrator ||
            user.EventsAccess ==
                ModuleAccess.Admin;
    }

    // =========================================================
    // QUERY HELPER
    // =========================================================

    private async Task<EventDto?> GetEventDtoAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Events
            .AsNoTracking()
            .Where(eventRecord =>
                eventRecord.Id == id)
            .Select(eventRecord =>
                new EventDto
                {
                    Id =
                        eventRecord.Id,

                    Description =
                        eventRecord.Description,

                    EventDate =
                        eventRecord.EventDate,

                    Stage =
                        eventRecord.Stage,

                    BudgetCad =
                        eventRecord.BudgetCad,

                    Notes =
                        eventRecord.Notes,

                    VendorId =
                        eventRecord.VendorId,

                    VendorName =
                        eventRecord.Vendor.Name,

                    ApprovalStatus =
                        eventRecord.ApprovalStatus,

                    SubmittedByUserId =
                        eventRecord.SubmittedByUserId,

                    SubmittedByUserName =
                        eventRecord.SubmittedByUser == null
                            ? null
                            : eventRecord.SubmittedByUser.FirstName +
                              " " +
                              eventRecord.SubmittedByUser.LastName,

                    ReviewedByUserId =
                        eventRecord.ReviewedByUserId,

                    ReviewedByUserName =
                        eventRecord.ReviewedByUser == null
                            ? null
                            : eventRecord.ReviewedByUser.FirstName +
                              " " +
                              eventRecord.ReviewedByUser.LastName,

                    ReviewedAtUtc =
                        eventRecord.ReviewedAtUtc,

                    ReviewNotes =
                        eventRecord.ReviewNotes,

                    CreatedAtUtc =
                        eventRecord.CreatedAtUtc,

                    UpdatedAtUtc =
                        eventRecord.UpdatedAtUtc
                })
            .SingleOrDefaultAsync(
                cancellationToken);
    }

    // =========================================================
    // DTO MAPPING
    // Used by GET ONE after navigation properties are loaded.
    // =========================================================

    private static EventDto MapToDto(
        PortfolioEvent eventRecord)
    {
        return new EventDto
        {
            Id =
                eventRecord.Id,

            Description =
                eventRecord.Description,

            EventDate =
                eventRecord.EventDate,

            Stage =
                eventRecord.Stage,

            BudgetCad =
                eventRecord.BudgetCad,

            Notes =
                eventRecord.Notes,

            VendorId =
                eventRecord.VendorId,

            VendorName =
                eventRecord.Vendor.Name,

            ApprovalStatus =
                eventRecord.ApprovalStatus,

            SubmittedByUserId =
                eventRecord.SubmittedByUserId,

            SubmittedByUserName =
                eventRecord.SubmittedByUser == null
                    ? null
                    : $"{eventRecord.SubmittedByUser.FirstName} {eventRecord.SubmittedByUser.LastName}",

            ReviewedByUserId =
                eventRecord.ReviewedByUserId,

            ReviewedByUserName =
                eventRecord.ReviewedByUser == null
                    ? null
                    : $"{eventRecord.ReviewedByUser.FirstName} {eventRecord.ReviewedByUser.LastName}",

            ReviewedAtUtc =
                eventRecord.ReviewedAtUtc,

            ReviewNotes =
                eventRecord.ReviewNotes,

            CreatedAtUtc =
                eventRecord.CreatedAtUtc,

            UpdatedAtUtc =
                eventRecord.UpdatedAtUtc
        };
    }

    // =========================================================
    // GENERAL HELPER
    // =========================================================

    private static string? NormalizeOptionalText(
        string? value)
    {
        return string.IsNullOrWhiteSpace(
            value)
            ? null
            : value.Trim();
    }
}