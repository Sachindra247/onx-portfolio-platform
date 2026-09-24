using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Vendors;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Domain.Vendors;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/vendors")]
public sealed class VendorsController :
    ControllerBase
{
    private readonly AppDbContext
        _dbContext;

    private readonly CurrentUserService
        _currentUserService;

    public VendorsController(
        AppDbContext dbContext,
        CurrentUserService currentUserService)
    {
        _dbContext =
            dbContext;

        _currentUserService =
            currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<VendorDto>),
        StatusCodes.Status200OK)]
    public async Task<
        ActionResult<IReadOnlyList<VendorDto>>>
        GetVendors(
            [FromQuery]
            bool activeOnly = true,
            CancellationToken cancellationToken =
                default)
    {
        var query =
            _dbContext.Vendors
                .AsNoTracking();

        if (activeOnly)
        {
            query =
                query.Where(
                    vendor =>
                        vendor.IsActive);
        }

        var vendors =
            await query
                .OrderBy(
                    vendor =>
                        vendor.Name)
                .Select(
                    vendor =>
                        new VendorDto
                        {
                            Id =
                                vendor.Id,

                            Name =
                                vendor.Name,

                            IsActive =
                                vendor.IsActive
                        })
                .ToListAsync(
                    cancellationToken);

        return Ok(vendors);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(VendorDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDto>>
        GetVendor(
            Guid id,
            CancellationToken cancellationToken)
    {
        var vendor =
            await _dbContext.Vendors
                .AsNoTracking()
                .Where(
                    vendor =>
                        vendor.Id == id)
                .Select(
                    vendor =>
                        new VendorDto
                        {
                            Id =
                                vendor.Id,

                            Name =
                                vendor.Name,

                            IsActive =
                                vendor.IsActive
                        })
                .SingleOrDefaultAsync(
                    cancellationToken);

        if (vendor is null)
        {
            return NotFound();
        }

        return Ok(vendor);
    }

    // =========================================================
    // CREATE VENDOR
    // Global Admins, Events Admins, and Certifications Admins only.
    // =========================================================

    [HttpPost]
    [ProducesResponseType(
        typeof(VendorDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<VendorDto>>
        CreateVendor(
            CreateVendorRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser =
            await _currentUserService
                .GetUserAsync(
                    cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(
        currentUser))
{
    return Forbid();
}

        var normalizedName =
            request.Name.Trim();

        var duplicateExists =
            await _dbContext.Vendors
                .AnyAsync(
                    vendor =>
                        vendor.Name
                            .ToLower() ==
                        normalizedName
                            .ToLower(),
                    cancellationToken);

        if (duplicateExists)
        {
            ModelState.AddModelError(
                nameof(request.Name),
                "A vendor with this name already exists.");

            return ValidationProblem(
                ModelState);
        }

        var now =
            DateTimeOffset.UtcNow;

        var vendor =
            new Vendor
            {
                Id =
                    Guid.NewGuid(),

                Name =
                    normalizedName,

                IsActive =
                    true,

                CreatedAtUtc =
                    now,

                UpdatedAtUtc =
                    now
            };

        _dbContext.Vendors.Add(
            vendor);

        await _dbContext
            .SaveChangesAsync(
                cancellationToken);

        var result =
            new VendorDto
            {
                Id =
                    vendor.Id,

                Name =
                    vendor.Name,

                IsActive =
                    vendor.IsActive
            };

        return CreatedAtAction(
            nameof(GetVendor),
            new
            {
                id = vendor.Id
            },
            result);
    }

    [HttpPut("{id:guid}")]
[ProducesResponseType(
    typeof(VendorDto),
    StatusCodes.Status200OK)]
[ProducesResponseType(
    StatusCodes.Status400BadRequest)]
[ProducesResponseType(
    StatusCodes.Status401Unauthorized)]
[ProducesResponseType(
    StatusCodes.Status403Forbidden)]
[ProducesResponseType(
    StatusCodes.Status404NotFound)]
public async Task<ActionResult<VendorDto>>
    UpdateVendor(
        Guid id,
        UpdateVendorRequest request,
        CancellationToken cancellationToken)
{
    var currentUser =
        await _currentUserService
            .GetUserAsync(
                cancellationToken);

    if (currentUser is null)
    {
        return Unauthorized();
    }

    if (!CanManageVendors(
            currentUser))
    {
        return Forbid();
    }

    var vendor =
        await _dbContext.Vendors
            .SingleOrDefaultAsync(
                vendor =>
                    vendor.Id == id,
                cancellationToken);

    if (vendor is null)
    {
        return NotFound();
    }

    var normalizedName =
        request.Name.Trim();

    if (string.IsNullOrWhiteSpace(
            normalizedName))
    {
        ModelState.AddModelError(
            nameof(request.Name),
            "Vendor name is required.");

        return ValidationProblem(
            ModelState);
    }

    var duplicateExists =
        await _dbContext.Vendors
            .AnyAsync(
                otherVendor =>
                    otherVendor.Id != id &&
                    otherVendor.Name
                        .ToLower() ==
                    normalizedName
                        .ToLower(),
                cancellationToken);

    if (duplicateExists)
    {
        ModelState.AddModelError(
            nameof(request.Name),
            "A vendor with this name already exists.");

        return ValidationProblem(
            ModelState);
    }

    vendor.Name =
        normalizedName;

    vendor.UpdatedAtUtc =
        DateTimeOffset.UtcNow;

    await _dbContext
        .SaveChangesAsync(
            cancellationToken);

    return Ok(
        new VendorDto
        {
            Id =
                vendor.Id,

            Name =
                vendor.Name,

            IsActive =
                vendor.IsActive
        });
}

    private static bool CanManageEvents(
        ApplicationUser user)
    {
        return
            user.IsGlobalAdministrator ||
            user.EventsAccess ==
                ModuleAccess.Admin;
    }

    private static bool CanManageVendors(
    ApplicationUser user)
{
    return
        user.IsGlobalAdministrator ||
        user.EventsAccess ==
            ModuleAccess.Admin ||
        user.CertificationsAccess ==
            ModuleAccess.Admin;
}
}