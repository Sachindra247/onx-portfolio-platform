using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Application.Events;
using OnXPortfolio.Domain.Events;
using OnXPortfolio.Infrastructure.Persistence;
using PortfolioEvent = OnXPortfolio.Domain.Events.Event;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public EventsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<EventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetEvents(
        [FromQuery] string? search,
        [FromQuery] EventStage? stage,
        [FromQuery] Guid? vendorId,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Events
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();

            query = query.Where(portfolioEvent =>
                portfolioEvent.Description.Contains(normalizedSearch) ||
                (portfolioEvent.Notes != null &&
                 portfolioEvent.Notes.Contains(normalizedSearch)) ||
                portfolioEvent.Vendor.Name.Contains(normalizedSearch));
        }

        if (stage.HasValue)
        {
            query = query.Where(portfolioEvent =>
                portfolioEvent.Stage == stage.Value);
        }

        if (vendorId.HasValue)
        {
            query = query.Where(portfolioEvent =>
                portfolioEvent.VendorId == vendorId.Value);
        }

        var events = await query
            .OrderBy(portfolioEvent => portfolioEvent.EventDate == null)
            .ThenBy(portfolioEvent => portfolioEvent.EventDate)
            .ThenBy(portfolioEvent => portfolioEvent.Description)
            .Select(portfolioEvent => new EventDto
{
    Id = portfolioEvent.Id,
    Description = portfolioEvent.Description,
    EventDate = portfolioEvent.EventDate,
    Stage = portfolioEvent.Stage,
    BudgetCad = portfolioEvent.BudgetCad,
    Notes = portfolioEvent.Notes,
    VendorId = portfolioEvent.VendorId,
    VendorName = portfolioEvent.Vendor.Name,
    CreatedAtUtc = portfolioEvent.CreatedAtUtc,
    UpdatedAtUtc = portfolioEvent.UpdatedAtUtc
})
            .ToListAsync(cancellationToken);

        return Ok(events);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> GetEvent(
        Guid id,
        CancellationToken cancellationToken)
    {
        var portfolioEvent = await _dbContext.Events
            .AsNoTracking()
            .Where(portfolioEvent => portfolioEvent.Id == id)
            .Select(portfolioEvent => new EventDto
{
    Id = portfolioEvent.Id,
    Description = portfolioEvent.Description,
    EventDate = portfolioEvent.EventDate,
    Stage = portfolioEvent.Stage,
    BudgetCad = portfolioEvent.BudgetCad,
    Notes = portfolioEvent.Notes,
    VendorId = portfolioEvent.VendorId,
    VendorName = portfolioEvent.Vendor.Name,
    CreatedAtUtc = portfolioEvent.CreatedAtUtc,
    UpdatedAtUtc = portfolioEvent.UpdatedAtUtc
})
            .SingleOrDefaultAsync(cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        return Ok(portfolioEvent);
    }

    [HttpPost]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventDto>> CreateEvent(
        CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        var vendorExists = await _dbContext.Vendors
            .AnyAsync(
                vendor => vendor.Id == request.VendorId && vendor.IsActive,
                cancellationToken);

        if (!vendorExists)
        {
            ModelState.AddModelError(
                nameof(request.VendorId),
                "The selected vendor does not exist or is inactive.");

            return ValidationProblem(ModelState);
        }

        var now = DateTimeOffset.UtcNow;

        var portfolioEvent = new PortfolioEvent
        {
            Id = Guid.NewGuid(),
            Description = request.Description.Trim(),
            EventDate = request.EventDate,
            Stage = request.Stage,
            BudgetCad = request.BudgetCad,
            Notes = NormalizeOptionalText(request.Notes),
            VendorId = request.VendorId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _dbContext.Events.Add(portfolioEvent);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var createdEvent = await GetEventDtoAsync(
            portfolioEvent.Id,
            cancellationToken);

        return CreatedAtAction(
            nameof(GetEvent),
            new { id = portfolioEvent.Id },
            createdEvent);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> UpdateEvent(
        Guid id,
        UpdateEventRequest request,
        CancellationToken cancellationToken)
    {
        var portfolioEvent = await _dbContext.Events
            .SingleOrDefaultAsync(
                portfolioEvent => portfolioEvent.Id == id,
                cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        var vendorExists = await _dbContext.Vendors
            .AnyAsync(
                vendor => vendor.Id == request.VendorId && vendor.IsActive,
                cancellationToken);

        if (!vendorExists)
        {
            ModelState.AddModelError(
                nameof(request.VendorId),
                "The selected vendor does not exist or is inactive.");

            return ValidationProblem(ModelState);
        }

        portfolioEvent.Description = request.Description.Trim();
        portfolioEvent.EventDate = request.EventDate;
        portfolioEvent.Stage = request.Stage;
        portfolioEvent.BudgetCad = request.BudgetCad;
        portfolioEvent.Notes = NormalizeOptionalText(request.Notes);
        portfolioEvent.VendorId = request.VendorId;
        portfolioEvent.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var updatedEvent = await GetEventDtoAsync(id, cancellationToken);

        return Ok(updatedEvent);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEvent(
        Guid id,
        CancellationToken cancellationToken)
    {
        var portfolioEvent = await _dbContext.Events
            .SingleOrDefaultAsync(
                portfolioEvent => portfolioEvent.Id == id,
                cancellationToken);

        if (portfolioEvent is null)
        {
            return NotFound();
        }

        _dbContext.Events.Remove(portfolioEvent);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<EventDto?> GetEventDtoAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Events
            .AsNoTracking()
            .Where(portfolioEvent => portfolioEvent.Id == id)
            .Select(portfolioEvent => new EventDto
{
    Id = portfolioEvent.Id,
    Description = portfolioEvent.Description,
    EventDate = portfolioEvent.EventDate,
    Stage = portfolioEvent.Stage,
    BudgetCad = portfolioEvent.BudgetCad,
    Notes = portfolioEvent.Notes,
    VendorId = portfolioEvent.VendorId,
    VendorName = portfolioEvent.Vendor.Name,
    CreatedAtUtc = portfolioEvent.CreatedAtUtc,
    UpdatedAtUtc = portfolioEvent.UpdatedAtUtc
})
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static EventDto MapToDto(PortfolioEvent portfolioEvent)
    {
        return new EventDto
        {
            Id = portfolioEvent.Id,
            Description = portfolioEvent.Description,
            EventDate = portfolioEvent.EventDate,
            Stage = portfolioEvent.Stage,
            BudgetCad = portfolioEvent.BudgetCad,
            Notes = portfolioEvent.Notes,
            VendorId = portfolioEvent.VendorId,
            VendorName = portfolioEvent.Vendor.Name,
            CreatedAtUtc = portfolioEvent.CreatedAtUtc,
            UpdatedAtUtc = portfolioEvent.UpdatedAtUtc
        };
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}