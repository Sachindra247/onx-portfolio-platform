using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Vacations;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Domain.Vacations;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/leave-requests")]
public sealed class LeaveRequestsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly CurrentUserService _currentUserService;

    public LeaveRequestsController(
        AppDbContext dbContext,
        CurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    // =========================================================
    // GET ALL
    // =========================================================

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<LeaveRequestDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<
        ActionResult<IReadOnlyList<LeaveRequestDto>>>
        GetLeaveRequests(
            [FromQuery] string? search,
            [FromQuery] LeaveType? leaveType,
            [FromQuery] LeaveRequestStatus? status,
            [FromQuery] DateOnly? fromDate,
            [FromQuery] DateOnly? toDate,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var query = _dbContext.LeaveRequests
            .AsNoTracking()
            .Include(request => request.EmployeeUser)
                .ThenInclude(user => user!.Group)
            .AsQueryable();

        // Normal users and managers can only see
        // vacation data belonging to their own group.
        if (!currentUser.IsGlobalAdministrator)
        {
            query = query.Where(request =>
                request.EmployeeUser != null &&
                request.EmployeeUser.GroupId ==
                    currentUser.GroupId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch =
                search.Trim();

            query = query.Where(request =>
                request.EmployeeName.Contains(
                    normalizedSearch) ||
                (
                    request.Reason != null &&
                    request.Reason.Contains(
                        normalizedSearch)
                ) ||
                (
                    request.ApproverName != null &&
                    request.ApproverName.Contains(
                        normalizedSearch)
                ) ||
                (
                    request.Notes != null &&
                    request.Notes.Contains(
                        normalizedSearch)
                ));
        }

        if (leaveType.HasValue)
        {
            query = query.Where(request =>
                request.LeaveType ==
                    leaveType.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(request =>
                request.Status ==
                    status.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(request =>
                request.EndDate >=
                    fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(request =>
                request.StartDate <=
                    toDate.Value);
        }

        var requests = await query
            .OrderBy(request =>
                request.StartDate)
            .ThenBy(request =>
                request.EmployeeName)
            .Select(request =>
                ToDto(request))
            .ToListAsync(
                cancellationToken);

        return Ok(requests);
    }

    // =========================================================
    // GET ONE
    // =========================================================

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(LeaveRequestDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeaveRequestDto>>
        GetLeaveRequest(
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

        var leaveRequest =
            await _dbContext.LeaveRequests
                .AsNoTracking()
                .Include(request =>
                    request.EmployeeUser)
                .SingleOrDefaultAsync(
                    request =>
                        request.Id == id,
                    cancellationToken);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        if (!CanViewRequest(
                currentUser,
                leaveRequest))
        {
            return Forbid();
        }

        return Ok(ToDto(leaveRequest));
    }

    // =========================================================
    // CREATE
    // =========================================================

    [HttpPost]
    [ProducesResponseType(
        typeof(LeaveRequestDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LeaveRequestDto>>
        CreateLeaveRequest(
            CreateLeaveRequestRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!IsValidDateRange(
                request.StartDate,
                request.EndDate))
        {
            ModelState.AddModelError(
                nameof(request.EndDate),
                "End date cannot be earlier than the start date.");

            return ValidationProblem(
                ModelState);
        }

        var now =
            DateTimeOffset.UtcNow;

        var leaveRequest =
            new LeaveRequest
            {
                Id = Guid.NewGuid(),

                EmployeeUserId =
                    currentUser.Id,

                EmployeeName =
                    $"{currentUser.FirstName} {currentUser.LastName}",

                LeaveType =
                    request.LeaveType,

                StartDate =
                    request.StartDate,

                EndDate =
                    request.EndDate,

                // Users cannot approve their own
                // request during creation.
                Status =
                    LeaveRequestStatus.Pending,

                Reason =
                    NormalizeOptional(
                        request.Reason),

                ApproverName =
                    currentUser.Manager is null
                        ? null
                        : $"{currentUser.Manager.FirstName} {currentUser.Manager.LastName}",

                Notes =
                    NormalizeOptional(
                        request.Notes),

                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

        _dbContext.LeaveRequests.Add(
            leaveRequest);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return CreatedAtAction(
            nameof(GetLeaveRequest),
            new
            {
                id = leaveRequest.Id
            },
            ToDto(leaveRequest));
    }

    // =========================================================
    // UPDATE
    // =========================================================

    [HttpPut("{id:guid}")]
    [ProducesResponseType(
        typeof(LeaveRequestDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
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

            return ValidationProblem(
                ModelState);
        }

        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var leaveRequest =
            await _dbContext.LeaveRequests
                .Include(item =>
                    item.EmployeeUser)
                .SingleOrDefaultAsync(
                    item =>
                        item.Id == id,
                    cancellationToken);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        var isOwner =
            leaveRequest.EmployeeUserId ==
                currentUser.Id;

        var canEdit =
            currentUser.IsGlobalAdministrator ||
            (
                isOwner &&
                (
                    leaveRequest.Status ==
                        LeaveRequestStatus.Pending ||
                    leaveRequest.Status ==
                        LeaveRequestStatus.Draft
                )
            );

        if (!canEdit)
        {
            return Forbid();
        }

        leaveRequest.LeaveType =
            request.LeaveType;

        leaveRequest.StartDate =
            request.StartDate;

        leaveRequest.EndDate =
            request.EndDate;

        leaveRequest.Reason =
            NormalizeOptional(
                request.Reason);

        leaveRequest.Notes =
            NormalizeOptional(
                request.Notes);

        if (currentUser.IsGlobalAdministrator)
        {
            // Global admins may administratively
            // update status.
            leaveRequest.Status =
                request.Status;

            leaveRequest.ApproverName =
                NormalizeOptional(
                    request.ApproverName);
        }
        else
        {
            // Editing your own leave automatically
            // returns it to Pending.
            leaveRequest.Status =
                LeaveRequestStatus.Pending;

            // Don't allow the browser payload to
            // impersonate an approver.
            leaveRequest.ApproverName =
                currentUser.Manager is null
                    ? null
                    : $"{currentUser.Manager.FirstName} {currentUser.Manager.LastName}";

            // Any previous review is no longer valid
            // after the employee changes the request.
            leaveRequest.ReviewedByUserId =
                null;

            leaveRequest.ReviewedAtUtc =
                null;
        }

        leaveRequest.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return Ok(
            ToDto(leaveRequest));
    }

    // =========================================================
    // DELETE
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
    public async Task<IActionResult>
        DeleteLeaveRequest(
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

        var leaveRequest =
            await _dbContext.LeaveRequests
                .SingleOrDefaultAsync(
                    item =>
                        item.Id == id,
                    cancellationToken);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        var isOwner =
            leaveRequest.EmployeeUserId ==
                currentUser.Id;

        var canDelete =
            currentUser.IsGlobalAdministrator ||
            (
                isOwner &&
                (
                    leaveRequest.Status ==
                        LeaveRequestStatus.Pending ||
                    leaveRequest.Status ==
                        LeaveRequestStatus.Draft
                )
            );

        if (!canDelete)
        {
            return Forbid();
        }

        _dbContext.LeaveRequests.Remove(
            leaveRequest);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return NoContent();
    }

    // =========================================================
    // APPROVE
    // =========================================================

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult>
        ApproveLeaveRequest(
            Guid id,
            CancellationToken cancellationToken)
    {
        return await ReviewLeaveRequest(
            id,
            LeaveRequestStatus.Approved,
            cancellationToken);
    }

    // =========================================================
    // REJECT
    // =========================================================

    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult>
        RejectLeaveRequest(
            Guid id,
            CancellationToken cancellationToken)
    {
        return await ReviewLeaveRequest(
            id,
            LeaveRequestStatus.Rejected,
            cancellationToken);
    }

    // =========================================================
    // REVIEW INTERNAL
    // =========================================================

    private async Task<IActionResult>
        ReviewLeaveRequest(
            Guid id,
            LeaveRequestStatus newStatus,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var leaveRequest =
            await _dbContext.LeaveRequests
                .Include(item =>
                    item.EmployeeUser)
                .SingleOrDefaultAsync(
                    item =>
                        item.Id == id,
                    cancellationToken);

        if (
            leaveRequest is null ||
            leaveRequest.EmployeeUser is null)
        {
            return NotFound();
        }

        var canReview =
            currentUser.IsGlobalAdministrator ||
            (
                currentUser.Role ==
                    UserRole.Manager &&
                currentUser.VacationAccess ==
                    ModuleAccess.Admin &&
                currentUser.GroupId ==
                    leaveRequest.EmployeeUser.GroupId
            );

        if (!canReview)
        {
            return Forbid();
        }

        // Only pending requests should normally
        // enter the approval workflow.
        if (
            leaveRequest.Status !=
                LeaveRequestStatus.Pending)
        {
            return BadRequest(
                new
                {
                    message =
                        "Only pending leave requests can be reviewed."
                });
        }

        leaveRequest.Status =
            newStatus;

        leaveRequest.ReviewedByUserId =
            currentUser.Id;

        leaveRequest.ReviewedAtUtc =
            DateTimeOffset.UtcNow;

        leaveRequest.ApproverName =
            $"{currentUser.FirstName} {currentUser.LastName}";

        leaveRequest.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return Ok();
    }

    // =========================================================
    // AUTHORIZATION HELPERS
    // =========================================================

    private static bool CanViewRequest(
        ApplicationUser currentUser,
        LeaveRequest request)
    {
        if (currentUser.IsGlobalAdministrator)
        {
            return true;
        }

        if (request.EmployeeUser is null)
        {
            return false;
        }

        return request.EmployeeUser.GroupId ==
            currentUser.GroupId;
    }

    // =========================================================
    // GENERAL HELPERS
    // =========================================================

    private static bool IsValidDateRange(
        DateOnly startDate,
        DateOnly endDate)
    {
        return endDate >= startDate;
    }

    private static string? NormalizeOptional(
        string? value)
    {
        return string.IsNullOrWhiteSpace(
            value)
            ? null
            : value.Trim();
    }

    private static LeaveRequestDto ToDto(
        LeaveRequest request)
    {
        return new LeaveRequestDto
        {
            Id = request.Id,

            EmployeeName =
                request.EmployeeName,

            LeaveType =
                request.LeaveType,

            StartDate =
                request.StartDate,

            EndDate =
                request.EndDate,

            Status =
                request.Status,

            Reason =
                request.Reason,

            ApproverName =
                request.ApproverName,

            Notes =
                request.Notes,

            CreatedAtUtc =
                request.CreatedAtUtc,

            UpdatedAtUtc =
                request.UpdatedAtUtc
        };
    }
}