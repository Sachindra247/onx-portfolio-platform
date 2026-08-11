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
    // All authenticated internal users may view certifications.
    // =========================================================

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<CertificationDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<
        ActionResult<IReadOnlyList<CertificationDto>>>
        GetCertifications(
            [FromQuery] string? search,
            [FromQuery] CertificationStatus? status,
            [FromQuery] Guid? vendorId,
            [FromQuery] DateOnly? expiringBefore,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService.GetUserAsync(
                cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        var query = _dbContext.Certifications
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch =
                search.Trim();

            query = query.Where(
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
            query = query.Where(
                certification =>
                    certification.Status ==
                    status.Value);
        }

        if (vendorId.HasValue)
        {
            query = query.Where(
                certification =>
                    certification.VendorId ==
                    vendorId.Value);
        }

        if (expiringBefore.HasValue)
        {
            query = query.Where(
                certification =>
                    certification.ExpiryDate != null &&
                    certification.ExpiryDate <=
                    expiringBefore.Value);
        }

        var certifications = await query
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

        return Ok(certifications);
    }

    // =========================================================
    // GET ONE
    // All authenticated internal users may view.
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

        return Ok(certification);
    }

    // =========================================================
    // CREATE
    // Raed / Certification Admin / Global Admin only.
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
                Id = Guid.NewGuid(),

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
                id = certification.Id
            },
            createdCertification);
    }

    // =========================================================
    // UPDATE
    // Raed / Certification Admin / Global Admin only.
    // No approval workflow required.
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
            request.Status;

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
    // Raed / Certification Admin / Global Admin only.
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

    private static bool CanManageCertifications(
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
        return await _dbContext.Certifications
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