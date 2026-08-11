using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Events;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Infrastructure.Persistence;
using PortfolioEvent = OnXPortfolio.Domain.Events.Event;
using OnXPortfolio.Domain.Events;

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
    // All authenticated internal users may view events.
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

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();

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
                    Id = portfolioEvent.Id,
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
    // All authenticated internal users may view.
    // =========================================================

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(EventDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
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
            await GetEventDtoAsync(
                id,
                cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        return Ok(portfolioEvent);
    }

    // =========================================================
    // CREATE
    // Sabrina / Events Admin / Global Admin only.
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
                Id = Guid.NewGuid(),

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
    // Sabrina / Events Admin / Global Admin only.
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
                    portfolioEvent =>
                        portfolioEvent.Id == id,
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
    // Sabrina / Events Admin / Global Admin only.
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
                    portfolioEvent =>
                        portfolioEvent.Id == id,
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
            .Where(portfolioEvent =>
                portfolioEvent.Id == id)
            .Select(portfolioEvent =>
                new EventDto
                {
                    Id = portfolioEvent.Id,
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
                    CreatedAtUtc =
                        portfolioEvent.CreatedAtUtc,
                    UpdatedAtUtc =
                        portfolioEvent.UpdatedAtUtc
                })
            .SingleOrDefaultAsync(
                cancellationToken);
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