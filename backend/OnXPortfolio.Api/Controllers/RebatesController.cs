using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Rebates;
using OnXPortfolio.Domain.Rebates;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/rebates")]
public sealed class RebatesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly CurrentUserService _currentUserService;

    public RebatesController(
        AppDbContext dbContext,
        CurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    // =========================================================
    // GET ALL
    //
    // All authenticated internal users may view rebates.
    //
    // This is intentionally broad during the initial beta.
    // Final module permissions will be defined once the
    // business requirements are confirmed.
    // =========================================================

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<RebateDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<
        ActionResult<IReadOnlyList<RebateDto>>>
        GetRebates(
            [FromQuery] string? search,
            [FromQuery] RebateStatus? status,
            [FromQuery] Guid? vendorId,
            [FromQuery] DateOnly? dueBefore,
            CancellationToken cancellationToken = default)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var query =
            _dbContext.Rebates
                .AsNoTracking()
                .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch =
                search.Trim();

            query =
                query.Where(
                    rebate =>
                        rebate.Title.Contains(
                            normalizedSearch) ||
                        rebate.Vendor.Name.Contains(
                            normalizedSearch) ||
                        (
                            rebate.ProgramName != null &&
                            rebate.ProgramName.Contains(
                                normalizedSearch)
                        ) ||
                        (
                            rebate.OwnerName != null &&
                            rebate.OwnerName.Contains(
                                normalizedSearch)
                        ) ||
                        (
                            rebate.Description != null &&
                            rebate.Description.Contains(
                                normalizedSearch)
                        ));
        }

        if (status.HasValue)
        {
            query =
                query.Where(
                    rebate =>
                        rebate.Status ==
                        status.Value);
        }

        if (vendorId.HasValue)
        {
            query =
                query.Where(
                    rebate =>
                        rebate.VendorId ==
                        vendorId.Value);
        }

        if (dueBefore.HasValue)
        {
            query =
                query.Where(
                    rebate =>
                        rebate.DueDate != null &&
                        rebate.DueDate <=
                        dueBefore.Value);
        }

        var rebates =
            await query
                .OrderBy(
                    rebate =>
                        rebate.DueDate == null)
                .ThenBy(
                    rebate =>
                        rebate.DueDate)
                .ThenBy(
                    rebate =>
                        rebate.Title)
                .Select(
                    rebate =>
                        new RebateDto
                        {
                            Id =
                                rebate.Id,

                            Title =
                                rebate.Title,

                            ProgramName =
                                rebate.ProgramName,

                            Description =
                                rebate.Description,

                            Status =
                                rebate.Status,

                            EstimatedAmount =
                                rebate.EstimatedAmount,

                            ActualAmount =
                                rebate.ActualAmount,

                            StartDate =
                                rebate.StartDate,

                            DueDate =
                                rebate.DueDate,

                            CompletedDate =
                                rebate.CompletedDate,

                            OwnerName =
                                rebate.OwnerName,

                            OwnerEmail =
                                rebate.OwnerEmail,

                            Notes =
                                rebate.Notes,

                            VendorId =
                                rebate.VendorId,

                            VendorName =
                                rebate.Vendor.Name,

                            CreatedAtUtc =
                                rebate.CreatedAtUtc,

                            UpdatedAtUtc =
                                rebate.UpdatedAtUtc
                        })
                .ToListAsync(
                    cancellationToken);

        return Ok(rebates);
    }

    // =========================================================
    // GET ONE
    //
    // All authenticated internal users may view a rebate.
    // =========================================================

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(RebateDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<
        ActionResult<RebateDto>>
        GetRebate(
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

        var rebate =
            await GetRebateDtoAsync(
                id,
                cancellationToken);

        if (rebate is null)
        {
            return NotFound();
        }

        return Ok(rebate);
    }

    // =========================================================
    // CREATE
    //
    // Global Administrator only during the initial beta.
    //
    // We intentionally do not introduce RebatesAccess yet
    // because the final business permission model has not
    // been confirmed.
    // =========================================================

    [HttpPost]
    [ProducesResponseType(
        typeof(RebateDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    public async Task<
        ActionResult<RebateDto>>
        CreateRebate(
            CreateRebateRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageRebates(currentUser))
        {
            return Forbid();
        }

        if (!IsValidDateRange(
                request.StartDate,
                request.DueDate,
                request.CompletedDate))
        {
            ModelState.AddModelError(
                nameof(request.DueDate),
                "Rebate dates are not in a valid chronological order.");

            return ValidationProblem(
                ModelState);
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

        var rebate =
            new Rebate
            {
                Id =
                    Guid.NewGuid(),

                Title =
                    request.Title.Trim(),

                ProgramName =
                    NormalizeOptionalText(
                        request.ProgramName),

                Description =
                    NormalizeOptionalText(
                        request.Description),

                Status =
                    request.Status,

                EstimatedAmount =
                    request.EstimatedAmount,

                ActualAmount =
                    request.ActualAmount,

                StartDate =
                    request.StartDate,

                DueDate =
                    request.DueDate,

                CompletedDate =
                    request.CompletedDate,

                OwnerName =
                    NormalizeOptionalText(
                        request.OwnerName),

                OwnerEmail =
                    NormalizeEmail(
                        request.OwnerEmail),

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

        _dbContext.Rebates.Add(
            rebate);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var createdRebate =
            await GetRebateDtoAsync(
                rebate.Id,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetRebate),
            new
            {
                id =
                    rebate.Id
            },
            createdRebate);
    }

    // =========================================================
    // UPDATE
    //
    // Global Administrator only during the initial beta.
    // =========================================================

    [HttpPut("{id:guid}")]
    [ProducesResponseType(
        typeof(RebateDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<
        ActionResult<RebateDto>>
        UpdateRebate(
            Guid id,
            UpdateRebateRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageRebates(currentUser))
        {
            return Forbid();
        }

        var rebate =
            await _dbContext.Rebates
                .SingleOrDefaultAsync(
                    rebate =>
                        rebate.Id == id,
                    cancellationToken);

        if (rebate is null)
        {
            return NotFound();
        }

        if (!IsValidDateRange(
                request.StartDate,
                request.DueDate,
                request.CompletedDate))
        {
            ModelState.AddModelError(
                nameof(request.DueDate),
                "Rebate dates are not in a valid chronological order.");

            return ValidationProblem(
                ModelState);
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

        rebate.Title =
            request.Title.Trim();

        rebate.ProgramName =
            NormalizeOptionalText(
                request.ProgramName);

        rebate.Description =
            NormalizeOptionalText(
                request.Description);

        rebate.Status =
            request.Status;

        rebate.EstimatedAmount =
            request.EstimatedAmount;

        rebate.ActualAmount =
            request.ActualAmount;

        rebate.StartDate =
            request.StartDate;

        rebate.DueDate =
            request.DueDate;

        rebate.CompletedDate =
            request.CompletedDate;

        rebate.OwnerName =
            NormalizeOptionalText(
                request.OwnerName);

        rebate.OwnerEmail =
            NormalizeEmail(
                request.OwnerEmail);

        rebate.Notes =
            NormalizeOptionalText(
                request.Notes);

        rebate.VendorId =
            request.VendorId;

        rebate.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var updatedRebate =
            await GetRebateDtoAsync(
                id,
                cancellationToken);

        return Ok(updatedRebate);
    }

    // =========================================================
    // DELETE
    //
    // Global Administrator only during the initial beta.
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
        DeleteRebate(
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

        if (!CanManageRebates(currentUser))
        {
            return Forbid();
        }

        var rebate =
            await _dbContext.Rebates
                .SingleOrDefaultAsync(
                    rebate =>
                        rebate.Id == id,
                    cancellationToken);

        if (rebate is null)
        {
            return NotFound();
        }

        _dbContext.Rebates.Remove(
            rebate);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return NoContent();
    }

    // =========================================================
    // AUTHORIZATION
    //
    // Temporary beta policy:
    //
    // Global Administrator = manage
    // Other authenticated users = read only
    //
    // This can later be replaced by RebatesAccess once
    // requirements and roles are confirmed.
    // =========================================================

    private static bool CanManageRebates(
        ApplicationUser user)
    {
        return user.IsGlobalAdministrator;
    }

    // =========================================================
    // QUERY HELPER
    // =========================================================

    private async Task<RebateDto?>
        GetRebateDtoAsync(
            Guid id,
            CancellationToken cancellationToken)
    {
        return await _dbContext.Rebates
            .AsNoTracking()
            .Where(
                rebate =>
                    rebate.Id == id)
            .Select(
                rebate =>
                    new RebateDto
                    {
                        Id =
                            rebate.Id,

                        Title =
                            rebate.Title,

                        ProgramName =
                            rebate.ProgramName,

                        Description =
                            rebate.Description,

                        Status =
                            rebate.Status,

                        EstimatedAmount =
                            rebate.EstimatedAmount,

                        ActualAmount =
                            rebate.ActualAmount,

                        StartDate =
                            rebate.StartDate,

                        DueDate =
                            rebate.DueDate,

                        CompletedDate =
                            rebate.CompletedDate,

                        OwnerName =
                            rebate.OwnerName,

                        OwnerEmail =
                            rebate.OwnerEmail,

                        Notes =
                            rebate.Notes,

                        VendorId =
                            rebate.VendorId,

                        VendorName =
                            rebate.Vendor.Name,

                        CreatedAtUtc =
                            rebate.CreatedAtUtc,

                        UpdatedAtUtc =
                            rebate.UpdatedAtUtc
                    })
            .SingleOrDefaultAsync(
                cancellationToken);
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    private static bool IsValidDateRange(
        DateOnly? startDate,
        DateOnly? dueDate,
        DateOnly? completedDate)
    {
        if (
            startDate.HasValue &&
            dueDate.HasValue &&
            dueDate.Value < startDate.Value)
        {
            return false;
        }

        if (
            startDate.HasValue &&
            completedDate.HasValue &&
            completedDate.Value < startDate.Value)
        {
            return false;
        }

        return true;
    }

    // =========================================================
    // GENERAL HELPERS
    // =========================================================

    private static string?
        NormalizeOptionalText(
            string? value)
    {
        return string.IsNullOrWhiteSpace(
            value)
            ? null
            : value.Trim();
    }

    private static string?
        NormalizeEmail(
            string? value)
    {
        var normalized =
            NormalizeOptionalText(value);

        return normalized?.ToLowerInvariant();
    }
}