using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Certifications;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/certifications")]
public sealed class CertificationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly CurrentUserService _currentUserService;

    public CertificationsController(
        AppDbContext dbContext,
        CurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    // =========================================================
    // GET ALL
    //
    // All authenticated internal users may view active
    // certification records.
    //
    // Archived certifications are hidden by default.
    //
    // Certification Admins / Global Admins may explicitly
    // request archived certifications using:
    //
    // ?includeArchived=true
    // =========================================================

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<CertificationDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    public async Task<
        ActionResult<IReadOnlyList<CertificationDto>>>
        GetCertifications(
            [FromQuery] string? search,
            [FromQuery] CertificationStatus? status,
            [FromQuery] Guid? vendorId,
            [FromQuery] DateOnly? expiringBefore,
            [FromQuery] bool includeArchived = false,
            CancellationToken cancellationToken = default)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var canManageCertifications =
            CanManageCertifications(
                currentUser);

        // Only Certification Admins / Global Admins
        // may explicitly retrieve archived records.
        if (
            includeArchived &&
            !canManageCertifications)
        {
            return Forbid();
        }

        var query =
            _dbContext.Certifications
                .AsNoTracking()
                .AsQueryable();

        // Archived certifications stay out of the
        // normal tracker and analytics.
        if (!includeArchived)
        {
            query =
                query.Where(
                    certification =>
                        certification.Status !=
                        CertificationStatus.Archived);
        }

        if (!string.IsNullOrWhiteSpace(
                search))
        {
            var normalizedSearch =
                search.Trim();

            query =
                query.Where(
                    certification =>
                        certification.PersonName.Contains(
                            normalizedSearch) ||
                        certification.CertificationName.Contains(
                            normalizedSearch) ||
                        certification.Vendor.Name.Contains(
                            normalizedSearch) ||
                        (
                            certification.PracticeLead != null &&
                            certification.PracticeLead.Contains(
                                normalizedSearch)
                        ) ||
                        (
                            certification.Notes != null &&
                            certification.Notes.Contains(
                                normalizedSearch)
                        ));
        }

        if (status.HasValue)
        {
            query =
                query.Where(
                    certification =>
                        certification.Status ==
                        status.Value);
        }

        if (vendorId.HasValue)
        {
            query =
                query.Where(
                    certification =>
                        certification.VendorId ==
                        vendorId.Value);
        }

        if (expiringBefore.HasValue)
        {
            query =
                query.Where(
                    certification =>
                        certification.ExpiryDate != null &&
                        certification.ExpiryDate <=
                        expiringBefore.Value);
        }

        var certifications =
            await query
                .OrderBy(
                    certification =>
                        certification.ExpiryDate == null)
                .ThenBy(
                    certification =>
                        certification.ExpiryDate)
                .ThenBy(
                    certification =>
                        certification.PersonName)
                .Select(
                    certification =>
                        new CertificationDto
                        {
                            Id =
                                certification.Id,

                            PersonName =
                                certification.PersonName,

                            CertificationName =
                                certification.CertificationName,

                            // Stored status is selected here.
                            // Effective expiry status is applied
                            // after the SQL query completes.
                            Status =
                                certification.Status,

                            DateCompleted =
                                certification.DateCompleted,

                            ExpiryDate =
                                certification.ExpiryDate,

                            PracticeLead =
                                certification.PracticeLead,

                            RebateImpact =
                                certification.RebateImpact,

                            Notes =
                                certification.Notes,

                            VendorId =
                                certification.VendorId,

                            VendorName =
                                certification.Vendor.Name,

                            CreatedAtUtc =
                                certification.CreatedAtUtc,

                            UpdatedAtUtc =
                                certification.UpdatedAtUtc
                        })
                .ToListAsync(
                    cancellationToken);

        var normalizedCertifications =
            certifications
                .Select(
                    NormalizeCertificationDto)
                .ToList();

        return Ok(
            normalizedCertifications);
    }

    // =========================================================
    // GET ONE
    //
    // Active certifications may be viewed by all authenticated
    // internal users.
    //
    // Archived certifications may only be retrieved by a
    // Certification Admin or Global Admin.
    // =========================================================

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(CertificationDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<
        ActionResult<CertificationDto>>
        GetCertification(
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

        var certification =
            await GetCertificationDtoAsync(
                id,
                cancellationToken);

        if (certification is null)
        {
            return NotFound();
        }

        // Archived certifications should remain hidden
        // from ordinary users even if they somehow know
        // the certification ID.
        if (
            certification.Status ==
                CertificationStatus.Archived &&
            !CanManageCertifications(
                currentUser))
        {
            return NotFound();
        }

        return Ok(
            certification);
    }

    // =========================================================
    // CREATE
    //
    // Certification Admin / Global Admin only.
    //
    // Archived is intentionally NOT valid when creating
    // a brand-new certification.
    // =========================================================

    [HttpPost]
    [ProducesResponseType(
        typeof(CertificationDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    public async Task<
        ActionResult<CertificationDto>>
        CreateCertification(
            CreateCertificationRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageCertifications(
                currentUser))
        {
            return Forbid();
        }

        // Archived is only a lifecycle action
        // performed against an existing record.
        if (
            request.Status ==
            CertificationStatus.Archived)
        {
            ModelState.AddModelError(
                nameof(request.Status),
                "A new certification cannot be created as Archived.");

            return ValidationProblem(
                ModelState);
        }

        if (!IsValidDateRange(
                request.DateCompleted,
                request.ExpiryDate))
        {
            ModelState.AddModelError(
                nameof(request.ExpiryDate),
                "Expiry date cannot be earlier than the completion date.");

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

        var certification =
            new Certification
            {
                Id =
                    Guid.NewGuid(),

                PersonName =
                    request.PersonName.Trim(),

                CertificationName =
                    request.CertificationName.Trim(),

                Status =
                    request.Status,

                DateCompleted =
                    request.DateCompleted,

                ExpiryDate =
                    request.ExpiryDate,

                PracticeLead =
                    NormalizeOptionalText(
                        request.PracticeLead),

                RebateImpact =
                    NormalizeOptionalText(
                        request.RebateImpact),

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

        _dbContext.Certifications.Add(
            certification);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var createdCertification =
            await GetCertificationDtoAsync(
                certification.Id,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetCertification),
            new
            {
                id =
                    certification.Id
            },
            createdCertification);
    }

    // =========================================================
    // UPDATE
    //
    // Certification Admin / Global Admin only.
    //
    // Archived is valid here.
    //
    // Renewal rule:
    //
    // If a certification was effectively Expired and an admin
    // gives it a future expiry date while leaving the selected
    // status as Expired, it automatically returns to Complete.
    // =========================================================

    [HttpPut("{id:guid}")]
    [ProducesResponseType(
        typeof(CertificationDto),
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
        ActionResult<CertificationDto>>
        UpdateCertification(
            Guid id,
            UpdateCertificationRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageCertifications(
                currentUser))
        {
            return Forbid();
        }

        var certification =
            await _dbContext.Certifications
                .SingleOrDefaultAsync(
                    certification =>
                        certification.Id == id,
                    cancellationToken);

        if (certification is null)
        {
            return NotFound();
        }

        if (!IsValidDateRange(
                request.DateCompleted,
                request.ExpiryDate))
        {
            ModelState.AddModelError(
                nameof(request.ExpiryDate),
                "Expiry date cannot be earlier than the completion date.");

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

        certification.PersonName =
            request.PersonName.Trim();

        certification.CertificationName =
            request.CertificationName.Trim();

        certification.Status =
            ResolveUpdatedStatus(
                request.Status,
                request.ExpiryDate);

        certification.DateCompleted =
            request.DateCompleted;

        certification.ExpiryDate =
            request.ExpiryDate;

        certification.PracticeLead =
            NormalizeOptionalText(
                request.PracticeLead);

        certification.RebateImpact =
            NormalizeOptionalText(
                request.RebateImpact);

        certification.Notes =
            NormalizeOptionalText(
                request.Notes);

        certification.VendorId =
            request.VendorId;

        certification.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var updatedCertification =
            await GetCertificationDtoAsync(
                id,
                cancellationToken);

        return Ok(
            updatedCertification);
    }

    // =========================================================
    // DELETE
    //
    // Certification Admin / Global Admin only.
    //
    // Permanent deletion remains available, although Archived
    // should normally be preferred when a certification simply
    // no longer needs to be tracked.
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
        DeleteCertification(
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

        if (!CanManageCertifications(
                currentUser))
        {
            return Forbid();
        }

        var certification =
            await _dbContext.Certifications
                .SingleOrDefaultAsync(
                    certification =>
                        certification.Id == id,
                    cancellationToken);

        if (certification is null)
        {
            return NotFound();
        }

        _dbContext.Certifications.Remove(
            certification);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return NoContent();
    }

    // =========================================================
    // AUTHORIZATION
    // =========================================================

    private static bool
        CanManageCertifications(
            ApplicationUser user)
    {
        return
            user.IsGlobalAdministrator ||
            user.CertificationsAccess ==
                ModuleAccess.Admin;
    }

    // =========================================================
    // QUERY HELPER
    // =========================================================

    private async Task<CertificationDto?>
        GetCertificationDtoAsync(
            Guid id,
            CancellationToken cancellationToken)
    {
        var certification =
            await _dbContext.Certifications
                .AsNoTracking()
                .Where(
                    certification =>
                        certification.Id == id)
                .Select(
                    certification =>
                        new CertificationDto
                        {
                            Id =
                                certification.Id,

                            PersonName =
                                certification.PersonName,

                            CertificationName =
                                certification.CertificationName,

                            Status =
                                certification.Status,

                            DateCompleted =
                                certification.DateCompleted,

                            ExpiryDate =
                                certification.ExpiryDate,

                            PracticeLead =
                                certification.PracticeLead,

                            RebateImpact =
                                certification.RebateImpact,

                            Notes =
                                certification.Notes,

                            VendorId =
                                certification.VendorId,

                            VendorName =
                                certification.Vendor.Name,

                            CreatedAtUtc =
                                certification.CreatedAtUtc,

                            UpdatedAtUtc =
                                certification.UpdatedAtUtc
                        })
                .SingleOrDefaultAsync(
                    cancellationToken);

        return certification is null
            ? null
            : NormalizeCertificationDto(
                certification);
    }

    // =========================================================
    // EFFECTIVE STATUS
    //
    // Archived always wins.
    //
    // Otherwise, if the expiry date has already passed,
    // the API reports Expired even when older imported data
    // still contains Complete/InProgress/etc.
    //
    // This does not silently rewrite historical database rows.
    // =========================================================

    private static CertificationStatus
        GetEffectiveStatus(
            CertificationStatus storedStatus,
            DateOnly? expiryDate)
    {
        if (
            storedStatus ==
            CertificationStatus.Archived)
        {
            return CertificationStatus.Archived;
        }

        if (
            expiryDate.HasValue &&
            expiryDate.Value <
                GetToday())
        {
            return CertificationStatus.Expired;
        }

        return storedStatus;
    }

    // =========================================================
    // RENEWAL STATUS
    //
    // Example:
    //
    // Existing cert:
    // Expired / 2026-08-01
    //
    // Admin edits:
    // Expired / 2027-08-01
    //
    // Result:
    // Complete / 2027-08-01
    //
    // If the admin deliberately selects another valid status
    // such as InProgress, that selected status is preserved.
    // =========================================================

    private static CertificationStatus
        ResolveUpdatedStatus(
            CertificationStatus requestedStatus,
            DateOnly? expiryDate)
    {
        if (
            requestedStatus ==
            CertificationStatus.Archived)
        {
            return CertificationStatus.Archived;
        }

        if (
            requestedStatus ==
                CertificationStatus.Expired &&
            expiryDate.HasValue &&
            expiryDate.Value >=
                GetToday())
        {
            return CertificationStatus.Complete;
        }

        return requestedStatus;
    }

    // =========================================================
    // DTO NORMALIZATION
    // =========================================================

    private static CertificationDto
        NormalizeCertificationDto(
            CertificationDto certification)
    {
        return new CertificationDto
        {
            Id =
                certification.Id,

            PersonName =
                certification.PersonName,

            CertificationName =
                certification.CertificationName,

            Status =
                GetEffectiveStatus(
                    certification.Status,
                    certification.ExpiryDate),

            DateCompleted =
                certification.DateCompleted,

            ExpiryDate =
                certification.ExpiryDate,

            PracticeLead =
                certification.PracticeLead,

            RebateImpact =
                certification.RebateImpact,

            Notes =
                certification.Notes,

            VendorId =
                certification.VendorId,

            VendorName =
                certification.VendorName,

            CreatedAtUtc =
                certification.CreatedAtUtc,

            UpdatedAtUtc =
                certification.UpdatedAtUtc
        };
    }

    // =========================================================
    // GENERAL HELPERS
    // =========================================================

    private static bool IsValidDateRange(
        DateOnly? completedDate,
        DateOnly? expiryDate)
    {
        return
            !completedDate.HasValue ||
            !expiryDate.HasValue ||
            expiryDate.Value >=
                completedDate.Value;
    }

    private static DateOnly GetToday()
    {
        return DateOnly.FromDateTime(
            DateTime.UtcNow);
    }

    private static string?
        NormalizeOptionalText(
            string? value)
    {
        return string.IsNullOrWhiteSpace(
            value)
            ? null
            : value.Trim();
    }
}