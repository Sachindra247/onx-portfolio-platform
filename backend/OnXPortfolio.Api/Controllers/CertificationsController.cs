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
                .Include(certification =>
    certification.CertificationPerson)
    .ThenInclude(person =>
        person!.ApplicationUser)
        .ThenInclude(user =>
            user!.Manager)
.Include(certification =>
    certification.CertificationPerson)
    .ThenInclude(person =>
        person!.ManagerPerson)
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
                                certification.UpdatedAtUtc,
                            CertificationPersonId =
    certification.CertificationPersonId,

PersonApplicationUserId =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUserId,

PersonEmail =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUser != null
            ? certification.CertificationPerson.ApplicationUser.Email
            : certification.CertificationPerson.Email,

ManagerCertificationPersonId =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ManagerPersonId,

ManagerApplicationUserId =
    certification.CertificationPerson == null ||
    certification.CertificationPerson.ApplicationUser == null
        ? null
        : certification.CertificationPerson.ApplicationUser.ManagerId,

ManagerName =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUser != null &&
          certification.CertificationPerson.ApplicationUser.Manager != null
            ? certification.CertificationPerson.ApplicationUser.Manager.FirstName +
              " " +
              certification.CertificationPerson.ApplicationUser.Manager.LastName
            : certification.CertificationPerson.ManagerPerson != null
                ? certification.CertificationPerson.ManagerPerson.Name
                : null,

ManagerEmail =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUser != null &&
          certification.CertificationPerson.ApplicationUser.Manager != null
            ? certification.CertificationPerson.ApplicationUser.Manager.Email
            : certification.CertificationPerson.ManagerPerson != null
                ? certification.CertificationPerson.ManagerPerson.Email
                : null,
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
// SEARCH CERTIFICATION PEOPLE
//
// Searches both:
// 1. CertificationPeople directory
// 2. Existing ApplicationUsers
//
// Used by Add/Edit Certification autocomplete.
// =========================================================

[HttpGet("people/search")]
[ProducesResponseType(
    typeof(IReadOnlyList<CertificationPersonLookupDto>),
    StatusCodes.Status200OK)]
[ProducesResponseType(
    StatusCodes.Status401Unauthorized)]
public async Task<
    ActionResult<IReadOnlyList<CertificationPersonLookupDto>>>
    SearchCertificationPeople(
        [FromQuery] string? q,
        CancellationToken cancellationToken)
{
    var currentUser =
        await _currentUserService.GetUserAsync(
            cancellationToken);

    if (currentUser is null)
    {
        return Unauthorized();
    }

    var normalizedSearch =
        q?.Trim() ?? string.Empty;

    if (normalizedSearch.Length < 1)
    {
        return Ok(
            Array.Empty<CertificationPersonLookupDto>());
    }

    var loweredSearch =
        normalizedSearch.ToLower();

    var directoryPeople =
        await _dbContext.CertificationPeople
            .AsNoTracking()
            .Include(person =>
                person.ApplicationUser)
                .ThenInclude(user =>
                    user!.Manager)
            .Include(person =>
                person.ManagerPerson)
            .Where(person =>
                person.Name.ToLower().Contains(
                    loweredSearch) ||
                (
                    person.Email != null &&
                    person.Email.ToLower().Contains(
                        loweredSearch)
                ))
            .OrderBy(person =>
                person.Name)
            .Take(10)
            .ToListAsync(
                cancellationToken);

    var applicationUsers =
        await _dbContext.ApplicationUsers
            .AsNoTracking()
            .Include(user =>
                user.Manager)
            .Where(user =>
                user.IsActive &&
                (
                    (
                        user.FirstName + " " +
                        user.LastName
                    )
                    .ToLower()
                    .Contains(loweredSearch) ||
                    user.Email
                        .ToLower()
                        .Contains(loweredSearch)
                ))
            .OrderBy(user =>
                user.FirstName)
            .ThenBy(user =>
                user.LastName)
            .Take(10)
            .ToListAsync(
                cancellationToken);

    var results =
        new List<CertificationPersonLookupDto>();

    // Existing directory records first.
    foreach (var person in directoryPeople)
    {
        results.Add(
            new CertificationPersonLookupDto
            {
                CertificationPersonId =
                    person.Id,

                ApplicationUserId =
                    person.ApplicationUserId,

                Name =
                    person.ApplicationUser is null
                        ? person.Name
                        : BuildUserName(
                            person.ApplicationUser),

                Email =
                    person.ApplicationUser?.Email ??
                    person.Email,

                ManagerCertificationPersonId =
                    person.ManagerPersonId,

                ManagerApplicationUserId =
                    person.ApplicationUser?.ManagerId,

                ManagerName =
                    person.ApplicationUser?.Manager is null
                        ? person.ManagerPerson?.Name
                        : BuildUserName(
                            person.ApplicationUser.Manager),

                ManagerEmail =
                    person.ApplicationUser?.Manager?.Email ??
                    person.ManagerPerson?.Email,

                IsApplicationUser =
                    person.ApplicationUserId.HasValue
            });
    }

    // Add application users that are not already represented.
    foreach (var applicationUser in applicationUsers)
    {
        var alreadyIncluded =
            results.Any(result =>
                result.ApplicationUserId ==
                    applicationUser.Id);

        if (alreadyIncluded)
        {
            continue;
        }

        var existingDirectoryPerson =
            await _dbContext.CertificationPeople
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    person =>
                        person.ApplicationUserId ==
                            applicationUser.Id,
                    cancellationToken);

        results.Add(
            new CertificationPersonLookupDto
            {
                CertificationPersonId =
                    existingDirectoryPerson?.Id,

                ApplicationUserId =
                    applicationUser.Id,

                Name =
                    BuildUserName(
                        applicationUser),

                Email =
                    applicationUser.Email,

                ManagerCertificationPersonId =
                    existingDirectoryPerson
                        ?.ManagerPersonId,

                ManagerApplicationUserId =
                    applicationUser.ManagerId,

                ManagerName =
                    applicationUser.Manager is null
                        ? null
                        : BuildUserName(
                            applicationUser.Manager),

                ManagerEmail =
                    applicationUser.Manager?.Email,

                IsApplicationUser =
                    true
            });
    }

    return Ok(
        results
            .OrderBy(result =>
                result.Name)
            .Take(10)
            .ToList());
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

        CertificationPerson certificationPerson;

try
{
    certificationPerson =
        await ResolveCertificationPersonAsync(
            request.CertificationPersonId,
            request.PersonApplicationUserId,
            request.PersonName,
            request.PersonEmail,
            request.ManagerCertificationPersonId,
            request.ManagerApplicationUserId,
            request.ManagerName,
            request.ManagerEmail,
            now,
            cancellationToken);
}
catch (InvalidOperationException exception)
{
    return BadRequest(
        new
        {
            message =
                exception.Message
        });
}

        var certification =
            new Certification
            {
                Id =
                    Guid.NewGuid(),

                CertificationPersonId =
    certificationPerson.Id,

PersonName =
    certificationPerson.Name,

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

        CertificationPerson certificationPerson;

try
{
    certificationPerson =
        await ResolveCertificationPersonAsync(
            request.CertificationPersonId,
            request.PersonApplicationUserId,
            request.PersonName,
            request.PersonEmail,
            request.ManagerCertificationPersonId,
            request.ManagerApplicationUserId,
            request.ManagerName,
            request.ManagerEmail,
            DateTimeOffset.UtcNow,
            cancellationToken);
}
catch (InvalidOperationException exception)
{
    return BadRequest(
        new
        {
            message =
                exception.Message
        });
}

        certification.CertificationPersonId =
    certificationPerson.Id;

certification.PersonName =
    certificationPerson.Name;

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
                .Include(certification =>
    certification.CertificationPerson)
    .ThenInclude(person =>
        person!.ApplicationUser)
        .ThenInclude(user =>
            user!.Manager)
.Include(certification =>
    certification.CertificationPerson)
    .ThenInclude(person =>
        person!.ManagerPerson)
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
                                certification.UpdatedAtUtc,
                                CertificationPersonId =
    certification.CertificationPersonId,

PersonApplicationUserId =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUserId,

PersonEmail =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUser != null
            ? certification.CertificationPerson.ApplicationUser.Email
            : certification.CertificationPerson.Email,

ManagerCertificationPersonId =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ManagerPersonId,

ManagerApplicationUserId =
    certification.CertificationPerson == null ||
    certification.CertificationPerson.ApplicationUser == null
        ? null
        : certification.CertificationPerson.ApplicationUser.ManagerId,

ManagerName =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUser != null &&
          certification.CertificationPerson.ApplicationUser.Manager != null
            ? certification.CertificationPerson.ApplicationUser.Manager.FirstName +
              " " +
              certification.CertificationPerson.ApplicationUser.Manager.LastName
            : certification.CertificationPerson.ManagerPerson != null
                ? certification.CertificationPerson.ManagerPerson.Name
                : null,

ManagerEmail =
    certification.CertificationPerson == null
        ? null
        : certification.CertificationPerson.ApplicationUser != null &&
          certification.CertificationPerson.ApplicationUser.Manager != null
            ? certification.CertificationPerson.ApplicationUser.Manager.Email
            : certification.CertificationPerson.ManagerPerson != null
                ? certification.CertificationPerson.ManagerPerson.Email
                : null,
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

            CertificationPersonId =
    certification.CertificationPersonId,

PersonApplicationUserId =
    certification.PersonApplicationUserId,

PersonEmail =
    certification.PersonEmail,

ManagerCertificationPersonId =
    certification.ManagerCertificationPersonId,

ManagerApplicationUserId =
    certification.ManagerApplicationUserId,

ManagerName =
    certification.ManagerName,

ManagerEmail =
    certification.ManagerEmail,

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
                certification.UpdatedAtUtc,

        };
    }

    // =========================================================
// CERTIFICATION PERSON DIRECTORY
// =========================================================

private async Task<CertificationPerson>
    ResolveCertificationPersonAsync(
        Guid? certificationPersonId,
        Guid? applicationUserId,
        string personName,
        string? personEmail,
        Guid? managerCertificationPersonId,
        Guid? managerApplicationUserId,
        string? managerName,
        string? managerEmail,
        DateTimeOffset now,
        CancellationToken cancellationToken)
{
    CertificationPerson person;

    // -----------------------------------------------------
    // Existing CertificationPerson selected
    // -----------------------------------------------------

    if (certificationPersonId.HasValue)
    {
        person =
            await _dbContext.CertificationPeople
                .Include(item =>
                    item.ApplicationUser)
                    .ThenInclude(user =>
                        user!.Manager)
                .SingleOrDefaultAsync(
                    item =>
                        item.Id ==
                            certificationPersonId.Value,
                    cancellationToken)
            ?? throw new InvalidOperationException(
                "The selected certification person could not be found.");

        if (person.ApplicationUser is not null)
        {
            await SyncDirectoryPersonFromApplicationUserAsync(
                person,
                person.ApplicationUser,
                now,
                cancellationToken);

            return person;
        }

        person.Name =
            personName.Trim();

        person.Email =
            NormalizeOptionalText(
                personEmail);

        person.ManagerPersonId =
            await ResolveManagerPersonIdAsync(
                person.Id,
                managerCertificationPersonId,
                managerApplicationUserId,
                managerName,
                managerEmail,
                now,
                cancellationToken);

        person.UpdatedAtUtc =
            now;

        return person;
    }

    // -----------------------------------------------------
    // Existing ApplicationUser selected
    // -----------------------------------------------------

    if (applicationUserId.HasValue)
    {
        var applicationUser =
            await _dbContext.ApplicationUsers
                .Include(user =>
                    user.Manager)
                .SingleOrDefaultAsync(
                    user =>
                        user.Id ==
                            applicationUserId.Value &&
                        user.IsActive,
                    cancellationToken);

        if (applicationUser is null)
        {
            throw new InvalidOperationException(
                "The selected application user could not be found.");
        }

        person =
            await GetOrCreateDirectoryPersonForApplicationUserAsync(
                applicationUser,
                now,
                cancellationToken);

        await SyncDirectoryPersonFromApplicationUserAsync(
            person,
            applicationUser,
            now,
            cancellationToken);

        return person;
    }

    // -----------------------------------------------------
    // Manually entered person
    // -----------------------------------------------------

    var normalizedName =
        personName.Trim();

    var normalizedEmail =
        NormalizeOptionalText(
            personEmail);

    person =
        await FindManualCertificationPersonAsync(
            normalizedName,
            normalizedEmail,
            cancellationToken)
        ?? new CertificationPerson
        {
            Id =
                Guid.NewGuid(),

            Name =
                normalizedName,

            Email =
                normalizedEmail,

            CreatedAtUtc =
                now,

            UpdatedAtUtc =
                now
        };

    if (_dbContext.Entry(person).State ==
        EntityState.Detached)
    {
        _dbContext.CertificationPeople.Add(
            person);
    }

    person.Name =
        normalizedName;

    person.Email =
        normalizedEmail;

    person.ManagerPersonId =
        await ResolveManagerPersonIdAsync(
            person.Id,
            managerCertificationPersonId,
            managerApplicationUserId,
            managerName,
            managerEmail,
            now,
            cancellationToken);

    person.UpdatedAtUtc =
        now;

    return person;
}

private async Task<Guid?>
    ResolveManagerPersonIdAsync(
        Guid employeePersonId,
        Guid? managerCertificationPersonId,
        Guid? managerApplicationUserId,
        string? managerName,
        string? managerEmail,
        DateTimeOffset now,
        CancellationToken cancellationToken)
{
    CertificationPerson? manager =
        null;

    if (managerCertificationPersonId.HasValue)
    {
        manager =
            await _dbContext.CertificationPeople
                .SingleOrDefaultAsync(
                    person =>
                        person.Id ==
                            managerCertificationPersonId.Value,
                    cancellationToken);

        if (manager is null)
        {
            throw new InvalidOperationException(
                "The selected manager could not be found.");
        }
    }
    else if (managerApplicationUserId.HasValue)
    {
        var applicationUser =
            await _dbContext.ApplicationUsers
                .SingleOrDefaultAsync(
                    user =>
                        user.Id ==
                            managerApplicationUserId.Value &&
                        user.IsActive,
                    cancellationToken);

        if (applicationUser is null)
        {
            throw new InvalidOperationException(
                "The selected manager could not be found.");
        }

        manager =
            await GetOrCreateDirectoryPersonForApplicationUserAsync(
                applicationUser,
                now,
                cancellationToken);
    }
    else
    {
        var normalizedManagerName =
            NormalizeOptionalText(
                managerName);

        var normalizedManagerEmail =
            NormalizeOptionalText(
                managerEmail);

        if (
            normalizedManagerName is null &&
            normalizedManagerEmail is null)
        {
            return null;
        }

        if (normalizedManagerName is null)
        {
            throw new InvalidOperationException(
                "Enter the manager name.");
        }

        manager =
            await FindManualCertificationPersonAsync(
                normalizedManagerName,
                normalizedManagerEmail,
                cancellationToken);

        if (manager is null)
        {
            manager =
                new CertificationPerson
                {
                    Id =
                        Guid.NewGuid(),

                    Name =
                        normalizedManagerName,

                    Email =
                        normalizedManagerEmail,

                    CreatedAtUtc =
                        now,

                    UpdatedAtUtc =
                        now
                };

            _dbContext.CertificationPeople.Add(
                manager);
        }
        else
        {
            manager.Name =
                normalizedManagerName;

            manager.Email =
                normalizedManagerEmail;

            manager.UpdatedAtUtc =
                now;
        }
    }

    if (manager.Id == employeePersonId)
    {
        throw new InvalidOperationException(
            "A person cannot be their own manager.");
    }

    return manager.Id;
}

private async Task<CertificationPerson>
    GetOrCreateDirectoryPersonForApplicationUserAsync(
        ApplicationUser applicationUser,
        DateTimeOffset now,
        CancellationToken cancellationToken)
{
    var existing =
        await _dbContext.CertificationPeople
            .SingleOrDefaultAsync(
                person =>
                    person.ApplicationUserId ==
                        applicationUser.Id,
                cancellationToken);

    if (existing is not null)
    {
        existing.Name =
            BuildUserName(
                applicationUser);

        existing.Email =
            applicationUser.Email;

        existing.UpdatedAtUtc =
            now;

        return existing;
    }

    var created =
        new CertificationPerson
        {
            Id =
                Guid.NewGuid(),

            Name =
                BuildUserName(
                    applicationUser),

            Email =
                applicationUser.Email,

            ApplicationUserId =
                applicationUser.Id,

            CreatedAtUtc =
                now,

            UpdatedAtUtc =
                now
        };

    _dbContext.CertificationPeople.Add(
        created);

    return created;
}

private async Task
    SyncDirectoryPersonFromApplicationUserAsync(
        CertificationPerson person,
        ApplicationUser applicationUser,
        DateTimeOffset now,
        CancellationToken cancellationToken)
{
    person.Name =
        BuildUserName(
            applicationUser);

    person.Email =
        applicationUser.Email;

    person.ApplicationUserId =
        applicationUser.Id;

    if (applicationUser.ManagerId.HasValue)
    {
        var manager =
            await _dbContext.ApplicationUsers
                .SingleOrDefaultAsync(
                    user =>
                        user.Id ==
                            applicationUser.ManagerId.Value,
                    cancellationToken);

        if (manager is not null)
        {
            var managerPerson =
                await GetOrCreateDirectoryPersonForApplicationUserAsync(
                    manager,
                    now,
                    cancellationToken);

            person.ManagerPersonId =
                managerPerson.Id;
        }
    }
    else
    {
        person.ManagerPersonId =
            null;
    }

    person.UpdatedAtUtc =
        now;
}

private async Task<CertificationPerson?>
    FindManualCertificationPersonAsync(
        string name,
        string? email,
        CancellationToken cancellationToken)
{
    var loweredName =
        name.ToLower();

    var loweredEmail =
        email?.ToLower();

    if (loweredEmail is not null)
    {
        var emailMatch =
            await _dbContext.CertificationPeople
                .SingleOrDefaultAsync(
                    person =>
                        person.Email != null &&
                        person.Email.ToLower() ==
                            loweredEmail,
                    cancellationToken);

        if (emailMatch is not null)
        {
            return emailMatch;
        }
    }

    return await _dbContext.CertificationPeople
        .SingleOrDefaultAsync(
            person =>
                person.ApplicationUserId == null &&
                person.Name.ToLower() ==
                    loweredName,
            cancellationToken);
}

private static string BuildUserName(
    ApplicationUser user)
{
    return $"{user.FirstName} {user.LastName}".Trim();
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