using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Application.Vacations;
using OnXPortfolio.Domain.Vacations;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Route("api/leave-requests")]
public sealed class LeaveRequestsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public LeaveRequestsController(
        AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<LeaveRequestDto>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<LeaveRequestDto>>> GetLeaveRequests(
        [FromQuery] string? search,
        [FromQuery] LeaveType? leaveType,
        [FromQuery] LeaveRequestStatus? status,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.LeaveRequests
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();

            query = query.Where(request =>
                request.EmployeeName.Contains(
                    normalizedSearch) ||
                (request.Reason != null &&
                 request.Reason.Contains(
                     normalizedSearch)) ||
                (request.ApproverName != null &&
                 request.ApproverName.Contains(
                     normalizedSearch)) ||
                (request.Notes != null &&
                 request.Notes.Contains(
                     normalizedSearch)));
        }

        if (leaveType.HasValue)
        {
            query = query.Where(request =>
                request.LeaveType == leaveType.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(request =>
                request.Status == status.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(request =>
                request.EndDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(request =>
                request.StartDate <= toDate.Value);
        }

        var requests = await query
            .OrderBy(request => request.StartDate)
            .ThenBy(request => request.EmployeeName)
            .Select(request => ToDto(request))
            .ToListAsync(cancellationToken);

        return Ok(requests);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(LeaveRequestDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeaveRequestDto>>
        GetLeaveRequest(
            Guid id,
            CancellationToken cancellationToken)
    {
        var request = await _dbContext.LeaveRequests
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => ToDto(item))
            .SingleOrDefaultAsync(cancellationToken);

        if (request is null)
        {
            return NotFound();
        }

        return Ok(request);
    }

    [HttpPost]
    [ProducesResponseType(
        typeof(LeaveRequestDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LeaveRequestDto>>
        CreateLeaveRequest(
            CreateLeaveRequestRequest request,
            CancellationToken cancellationToken)
    {
        if (!IsValidDateRange(
                request.StartDate,
                request.EndDate))
        {
            ModelState.AddModelError(
                nameof(request.EndDate),
                "End date cannot be earlier than the start date.");

            return ValidationProblem(ModelState);
        }

        var now = DateTimeOffset.UtcNow;

        var leaveRequest = new LeaveRequest
        {
            Id = Guid.NewGuid(),
            EmployeeName =
                request.EmployeeName.Trim(),
            LeaveType = request.LeaveType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = request.Status,
            Reason = NormalizeOptional(
                request.Reason),
            ApproverName = NormalizeOptional(
                request.ApproverName),
            Notes = NormalizeOptional(
                request.Notes),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _dbContext.LeaveRequests.Add(leaveRequest);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var dto = ToDto(leaveRequest);

        return CreatedAtAction(
            nameof(GetLeaveRequest),
            new { id = leaveRequest.Id },
            dto);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(
        typeof(LeaveRequestDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeaveRequestDto>>
        UpdateLeaveRequest(
            Guid id,
            UpdateLeaveRequestRequest request,
            CancellationToken cancellationToken)
    {
        if (!IsValidDateRange(
                request.StartDate,
                request.EndDate))
        {
            ModelState.AddModelError(
                nameof(request.EndDate),
                "End date cannot be earlier than the start date.");

            return ValidationProblem(ModelState);
        }

        var leaveRequest =
            await _dbContext.LeaveRequests
                .SingleOrDefaultAsync(
                    item => item.Id == id,
                    cancellationToken);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        leaveRequest.EmployeeName =
            request.EmployeeName.Trim();
        leaveRequest.LeaveType =
            request.LeaveType;
        leaveRequest.StartDate =
            request.StartDate;
        leaveRequest.EndDate =
            request.EndDate;
        leaveRequest.Status =
            request.Status;
        leaveRequest.Reason =
            NormalizeOptional(request.Reason);
        leaveRequest.ApproverName =
            NormalizeOptional(
                request.ApproverName);
        leaveRequest.Notes =
            NormalizeOptional(request.Notes);
        leaveRequest.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return Ok(ToDto(leaveRequest));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLeaveRequest(
        Guid id,
        CancellationToken cancellationToken)
    {
        var leaveRequest =
            await _dbContext.LeaveRequests
                .SingleOrDefaultAsync(
                    item => item.Id == id,
                    cancellationToken);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        _dbContext.LeaveRequests.Remove(
            leaveRequest);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return NoContent();
    }

    private static bool IsValidDateRange(
        DateOnly startDate,
        DateOnly endDate)
    {
        return endDate >= startDate;
    }

    private static string? NormalizeOptional(
        string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    private static LeaveRequestDto ToDto(
        LeaveRequest request)
    {
        return new LeaveRequestDto
        {
            Id = request.Id,
            EmployeeName = request.EmployeeName,
            LeaveType = request.LeaveType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = request.Status,
            Reason = request.Reason,
            ApproverName = request.ApproverName,
            Notes = request.Notes,
            CreatedAtUtc = request.CreatedAtUtc,
            UpdatedAtUtc = request.UpdatedAtUtc
        };
    }
}