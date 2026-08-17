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
    //
    // Normal users:
    // - Approved events only
    // - Venue is visible
    // - Budget is hidden
    // - Business Purpose is hidden
    //
    // Events Admins / Global Admins:
    // - All events
    // - Full management information
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

        var canManageEvents =
            CanManageEvents(currentUser);

        var query = _dbContext.Events
            .AsNoTracking()
            .AsQueryable();

        // Normal users may only see approved events.
        if (!canManageEvents)
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
                (
                    portfolioEvent.Venue != null &&
                    portfolioEvent.Venue.Contains(
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

                    Venue =
                        portfolioEvent.Venue,

                    BusinessPurpose =
                        canManageEvents
                            ? portfolioEvent.BusinessPurpose
                            : null,

                    BudgetCad =
                        canManageEvents
                            ? portfolioEvent.BudgetCad
                            : 0m,

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
    //
    // Normal users may retrieve approved events only.
    // Private management fields are removed from their DTO.
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

        var canManageEvents =
            CanManageEvents(currentUser);

        if (
            !canManageEvents &&
            portfolioEvent.ApprovalStatus !=
                EventApprovalStatus.Approved)
        {
            return Forbid();
        }

        return Ok(
            MapToDto(
                portfolioEvent,
                canManageEvents));
    }

    // =========================================================
    // CREATE
    //
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

                Venue =
                    NormalizeOptionalText(
                        request.Venue),

                BusinessPurpose =
                    request.BusinessPurpose.Trim(),

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
    //
    // Events Admin / Global Admin only.
    //
    // Any edit sends the event back to Pending approval.
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

        portfolioEvent.Venue =
            NormalizeOptionalText(
                request.Venue);

        portfolioEvent.BusinessPurpose =
            request.BusinessPurpose.Trim();

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
        // may approve or reject events.
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
    // REGISTER FOR EVENT
    // Any authenticated user may register for an approved event.
    // =========================================================

    [HttpPost("{id:guid}/register")]
    [ProducesResponseType(
        typeof(EventRegistrationDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventRegistrationDto>>
        RegisterForEvent(
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
                EventApprovalStatus.Approved)
        {
            return BadRequest(
                new
                {
                    message =
                        "Only approved events are available for registration."
                });
        }

        var existingRegistration =
            await _dbContext.EventRegistrations
                .SingleOrDefaultAsync(
                    registration =>
                        registration.EventId == id &&
                        registration.UserId ==
                            currentUser.Id,
                    cancellationToken);

        var now =
            DateTimeOffset.UtcNow;

        if (existingRegistration is null)
        {
            existingRegistration =
                new EventRegistration
                {
                    Id =
                        Guid.NewGuid(),

                    EventId =
                        id,

                    UserId =
                        currentUser.Id,

                    Status =
                        EventRegistrationStatus.Registered,

                    CreatedAtUtc =
                        now,

                    UpdatedAtUtc =
                        now
                };

            _dbContext.EventRegistrations.Add(
                existingRegistration);
        }
        else
        {
            existingRegistration.Status =
                EventRegistrationStatus.Registered;

            existingRegistration.UpdatedAtUtc =
                now;
        }

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return Ok(
            MapRegistrationToDto(
                existingRegistration));
    }

    // =========================================================
    // CANCEL REGISTRATION
    // Users may cancel their own registration.
    // =========================================================

    [HttpDelete("{id:guid}/register")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelEventRegistration(
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

        var eventExists =
            await _dbContext.Events
                .AnyAsync(
                    eventRecord =>
                        eventRecord.Id == id,
                    cancellationToken);

        if (!eventExists)
        {
            return NotFound();
        }

        var registration =
            await _dbContext.EventRegistrations
                .SingleOrDefaultAsync(
                    item =>
                        item.EventId == id &&
                        item.UserId ==
                            currentUser.Id,
                    cancellationToken);

        if (
            registration is null ||
            registration.Status ==
                EventRegistrationStatus.Cancelled)
        {
            return NotFound(
                new
                {
                    message =
                        "No active registration was found for this event."
                });
        }

        registration.Status =
            EventRegistrationStatus.Cancelled;

        registration.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return NoContent();
    }

    // =========================================================
    // MY REGISTRATION
    // Returns the signed-in user's RSVP status.
    // =========================================================

    [HttpGet("{id:guid}/registration")]
    [ProducesResponseType(
        typeof(EventRegistrationDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventRegistrationDto>>
        GetMyEventRegistration(
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
                .SingleOrDefaultAsync(
                    eventRecord =>
                        eventRecord.Id == id,
                    cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        var registration =
            await _dbContext.EventRegistrations
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    item =>
                        item.EventId == id &&
                        item.UserId ==
                            currentUser.Id,
                    cancellationToken);

        if (registration is null)
        {
            return NotFound(
                new
                {
                    message =
                        "You are not registered for this event."
                });
        }

        return Ok(
            MapRegistrationToDto(
                registration));
    }

    // =========================================================
    // EVENT ATTENDEES
    // Events Admins and Global Admins may view attendees.
    // =========================================================

    [HttpGet("{id:guid}/registrations")]
    [ProducesResponseType(
        typeof(IReadOnlyList<EventAttendeeDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<
        ActionResult<IReadOnlyList<EventAttendeeDto>>>
        GetEventRegistrations(
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

        var eventExists =
            await _dbContext.Events
                .AsNoTracking()
                .AnyAsync(
                    eventRecord =>
                        eventRecord.Id == id,
                    cancellationToken);

        if (!eventExists)
        {
            return NotFound();
        }

        var attendees =
            await _dbContext.EventRegistrations
                .AsNoTracking()
                .Where(registration =>
                    registration.EventId == id &&
                    registration.Status ==
                        EventRegistrationStatus.Registered)
                .OrderBy(registration =>
                    registration.User.FirstName)
                .ThenBy(registration =>
                    registration.User.LastName)
                .Select(registration =>
                    new EventAttendeeDto
                    {
                        UserId =
                            registration.UserId,

                        Name =
                            registration.User.FirstName +
                            " " +
                            registration.User.LastName,

                        Email =
                            registration.User.Email,

                        RegisteredAtUtc =
                            registration.CreatedAtUtc
                    })
                .ToListAsync(
                    cancellationToken);

        return Ok(attendees);
    }

    // =========================================================
    // MY REGISTERED EVENTS
    //
    // Used by Profile.
    // Private Event management fields are intentionally hidden.
    // =========================================================

    [HttpGet("my-registrations")]
    [ProducesResponseType(
        typeof(IReadOnlyList<EventDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<EventDto>>>
        GetMyRegisteredEvents(
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var events =
            await _dbContext.EventRegistrations
                .AsNoTracking()
                .Where(registration =>
                    registration.UserId ==
                        currentUser.Id &&
                    registration.Status ==
                        EventRegistrationStatus.Registered &&
                    registration.Event.ApprovalStatus ==
                        EventApprovalStatus.Approved)
                .OrderBy(registration =>
                    registration.Event.EventDate == null)
                .ThenBy(registration =>
                    registration.Event.EventDate)
                .Select(registration =>
                    new EventDto
                    {
                        Id =
                            registration.Event.Id,

                        Description =
                            registration.Event.Description,

                        EventDate =
                            registration.Event.EventDate,

                        Stage =
                            registration.Event.Stage,

                        Venue =
                            registration.Event.Venue,

                        // Management-only information
                        // is deliberately withheld.
                        BusinessPurpose =
                            null,

                        BudgetCad =
                            0m,

                        Notes =
                            registration.Event.Notes,

                        VendorId =
                            registration.Event.VendorId,

                        VendorName =
                            registration.Event.Vendor.Name,

                        ApprovalStatus =
                            registration.Event.ApprovalStatus,

                        SubmittedByUserId =
                            registration.Event.SubmittedByUserId,

                        SubmittedByUserName =
                            registration.Event.SubmittedByUser == null
                                ? null
                                : registration.Event.SubmittedByUser.FirstName +
                                  " " +
                                  registration.Event.SubmittedByUser.LastName,

                        ReviewedByUserId =
                            registration.Event.ReviewedByUserId,

                        ReviewedByUserName =
                            registration.Event.ReviewedByUser == null
                                ? null
                                : registration.Event.ReviewedByUser.FirstName +
                                  " " +
                                  registration.Event.ReviewedByUser.LastName,

                        ReviewedAtUtc =
                            registration.Event.ReviewedAtUtc,

                        ReviewNotes =
                            registration.Event.ReviewNotes,

                        CreatedAtUtc =
                            registration.Event.CreatedAtUtc,

                        UpdatedAtUtc =
                            registration.Event.UpdatedAtUtc
                    })
                .ToListAsync(
                    cancellationToken);

        return Ok(events);
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
    //
    // This helper is used following management operations,
    // therefore full management fields are returned.
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

                    Venue =
                        eventRecord.Venue,

                    BusinessPurpose =
                        eventRecord.BusinessPurpose,

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
        PortfolioEvent eventRecord,
        bool includePrivateFields)
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

            Venue =
                eventRecord.Venue,

            BusinessPurpose =
                includePrivateFields
                    ? eventRecord.BusinessPurpose
                    : null,

            BudgetCad =
                includePrivateFields
                    ? eventRecord.BudgetCad
                    : 0m,

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
    // REGISTRATION DTO
    // =========================================================

    private static EventRegistrationDto MapRegistrationToDto(
        EventRegistration registration)
    {
        return new EventRegistrationDto
        {
            EventId =
                registration.EventId,

            UserId =
                registration.UserId,

            Status =
                registration.Status,

            CreatedAtUtc =
                registration.CreatedAtUtc,

            UpdatedAtUtc =
                registration.UpdatedAtUtc
        };
    }

    // =========================================================
    // GENERAL HELPER
    // =========================================================

    private static string? NormalizeOptionalText(
        string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}