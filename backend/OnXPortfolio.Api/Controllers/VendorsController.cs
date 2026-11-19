using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Vendors;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Domain.Vendors;
using OnXPortfolio.Infrastructure.Persistence;
using System.Linq.Expressions;

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


    private static readonly Expression<Func<Vendor, VendorDto>>
        VendorProjection = vendor => new VendorDto
        {
            Id = vendor.Id,
            Name = vendor.Name,
            IsActive = vendor.IsActive,

            // Partnership information
            PartnershipTier = vendor.PartnershipTier,
            PartnershipStatus = vendor.PartnershipStatus,
            PrimaryPartnerManagerId = vendor.PrimaryPartnerManagerId,
            PartnershipBenefits = vendor.PartnershipBenefits,
            PartnerPrograms = vendor.PartnerPrograms,

            // Structured vendor benefits
            DiscountPercentage = vendor.DiscountPercentage,
            RebatePercentage = vendor.RebatePercentage,
            DealRegistrationAvailable = vendor.DealRegistrationAvailable,
            DealRegistrationConditions = vendor.DealRegistrationConditions,
            SpiffAvailable = vendor.SpiffAvailable
        };

    private static readonly Func<Vendor, VendorDto>
        MapVendor = VendorProjection.Compile();


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
                .Select(VendorProjection)
                .ToListAsync(
                    cancellationToken);

        return Ok(vendors);
    }


    // =========================================================
    // GET ACTIVE INTERNAL PARTNER MANAGERS
    // Vendor Management administrators only.
    // =========================================================

    [HttpGet("partner-managers")]
    [ProducesResponseType(
        typeof(IReadOnlyList<VendorPartnerManagerDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<VendorPartnerManagerDto>>>
        GetPartnerManagers(CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        var managers = await _dbContext.ApplicationUsers
            .AsNoTracking()
            .Where(user => user.IsActive)
            .OrderBy(user => user.FirstName)
            .ThenBy(user => user.LastName)
            .Select(user => new VendorPartnerManagerDto
            {
                Id = user.Id,
                Name = user.FirstName + " " + user.LastName,
                Email = user.Email
            })
            .ToListAsync(cancellationToken);

        return Ok(managers);
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
        var vendor = await _dbContext.Vendors
    .AsNoTracking()
    .Where(vendor => vendor.Id == id)
    .Select(VendorProjection)
    .SingleOrDefaultAsync(cancellationToken);

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

       var result = MapVendor(vendor);

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

    return Ok(MapVendor(vendor));
}


    // =========================================================
    // UPDATE VENDOR PARTNERSHIP
    // Global, Events, and Certifications Admins only.
    // =========================================================

    [HttpPut("{id:guid}/partnership")]
    [ProducesResponseType(typeof(VendorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDto>> UpdateVendorPartnership(
        Guid id,
        [FromBody] UpdateVendorPartnershipRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        var vendor = await _dbContext.Vendors
            .SingleOrDefaultAsync(
                v => v.Id == id,
                cancellationToken);

        if (vendor is null)
        {
            return NotFound();
        }

        if (request.PrimaryPartnerManagerId.HasValue)
        {
            var managerExists = await _dbContext.ApplicationUsers
                .AsNoTracking()
                .AnyAsync(
                    user =>
                        user.Id == request.PrimaryPartnerManagerId.Value &&
                        user.IsActive,
                    cancellationToken);

            if (!managerExists)
            {
                ModelState.AddModelError(
                    nameof(request.PrimaryPartnerManagerId),
                    "The selected partner manager must be an active internal user.");

                return ValidationProblem(ModelState);
            }
        }

        vendor.PartnershipTier =
            request.PartnershipTier?.Trim();

        vendor.PartnershipStatus =
            request.PartnershipStatus?.Trim();

        vendor.PrimaryPartnerManagerId =
            request.PrimaryPartnerManagerId;

        vendor.PartnershipBenefits =
            request.PartnershipBenefits?.Trim();

        vendor.PartnerPrograms =
            request.PartnerPrograms?.Trim();

        vendor.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapVendor(vendor));
    }


    // =========================================================
    // UPDATE STRUCTURED VENDOR BENEFITS
    // Global, Events, and Certifications Admins only.
    // =========================================================

    [HttpPut("{id:guid}/benefits")]
    [ProducesResponseType(typeof(VendorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDto>> UpdateVendorBenefits(
        Guid id,
        [FromBody] UpdateVendorBenefitsRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        var vendor = await _dbContext.Vendors
            .SingleOrDefaultAsync(
                v => v.Id == id,
                cancellationToken);

        if (vendor is null)
        {
            return NotFound();
        }

        // Validate percentage precision.
        if (request.DiscountPercentage.HasValue &&
            decimal.Round(request.DiscountPercentage.Value, 2) !=
            request.DiscountPercentage.Value)
        {
            ModelState.AddModelError(
                nameof(request.DiscountPercentage),
                "Discount percentage cannot have more than two decimal places.");
        }

        if (request.RebatePercentage.HasValue &&
            decimal.Round(request.RebatePercentage.Value, 2) !=
            request.RebatePercentage.Value)
        {
            ModelState.AddModelError(
                nameof(request.RebatePercentage),
                "Rebate percentage cannot have more than two decimal places.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        // Update structured benefits only.
        vendor.DiscountPercentage =
            request.DiscountPercentage;

        vendor.RebatePercentage =
            request.RebatePercentage;

        vendor.DealRegistrationAvailable =
            request.DealRegistrationAvailable;

        vendor.DealRegistrationConditions =
            string.IsNullOrWhiteSpace(request.DealRegistrationConditions)
                ? null
                : request.DealRegistrationConditions.Trim();

        vendor.SpiffAvailable =
            request.SpiffAvailable;

        vendor.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapVendor(vendor));
    }



        // =========================================================
    // UPDATE VENDOR ACTIVE STATUS
    // Global Admins, Events Admins, and Certifications Admins only.
    // =========================================================

    [HttpPut("{id:guid}/active")]
    [ProducesResponseType(
        typeof(VendorDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDto>>
        UpdateVendorActiveStatus(
            Guid id,
            UpdateVendorActiveStatusRequest request,
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

        vendor.IsActive =
            request.IsActive;

        vendor.UpdatedAtUtc =
            DateTimeOffset.UtcNow;

        await _dbContext
            .SaveChangesAsync(
                cancellationToken);

        return Ok(MapVendor(vendor));
    }


    // =========================================================
    // DELETE VENDOR CONTACT
    // Global, Events, and Certifications Admins only.
    // =========================================================

    [HttpDelete("{id:guid}/contacts/{contactId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVendorContact(
        Guid id,
        Guid contactId,
        CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        var contact = await _dbContext.VendorContacts
            .SingleOrDefaultAsync(
                contact =>
                    contact.Id == contactId &&
                    contact.VendorId == id,
                cancellationToken);

        if (contact is null)
        {
            return NotFound();
        }

        _dbContext.VendorContacts.Remove(contact);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return NoContent();
    }


    // =========================================================
    // UPDATE VENDOR CONTACT
    // Global, Events, and Certifications Admins only.
    // =========================================================

    [HttpPut("{id:guid}/contacts/{contactId:guid}")]
    [ProducesResponseType(
        typeof(VendorContactDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorContactDto>>
        UpdateVendorContact(
            Guid id,
            Guid contactId,
            [FromBody] UpdateVendorContactRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        var name = request.Name?.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            ModelState.AddModelError(
                nameof(request.Name),
                "Contact name is required.");

            return ValidationProblem(ModelState);
        }


if (!VendorPhoneNumber.TryNormalize(
    request.Phone,
    out var normalizedPhone))
{
    ModelState.AddModelError(
        nameof(request.Phone),
        "Enter a valid 10-digit North American phone number with an optional +1 country code.");

    return ValidationProblem(ModelState);
}


        var contact = await _dbContext.VendorContacts
            .SingleOrDefaultAsync(
                contact =>
                    contact.Id == contactId &&
                    contact.VendorId == id,
                cancellationToken);

        if (contact is null)
        {
            return NotFound();
        }

        contact.Name = name;
        contact.JobTitle = request.JobTitle?.Trim();
        contact.Email = request.Email?.Trim();
        contact.Phone = normalizedPhone;
        contact.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(
            cancellationToken);


return Ok(new VendorContactDto
{
    Id = contact.Id,
    VendorId = contact.VendorId,
    Name = contact.Name,
    JobTitle = contact.JobTitle,
    Email = contact.Email,
    Phone = contact.Phone,
    UpdatedAtUtc = contact.UpdatedAtUtc
});

    }


    // =========================================================
    // CREATE VENDOR CONTACT
    // Global, Events, and Certifications Admins only.
    // =========================================================

    [HttpPost("{id:guid}/contacts")]
    [ProducesResponseType(
        typeof(VendorContactDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorContactDto>>
        CreateVendorContact(
            Guid id,
            [FromBody] CreateVendorContactRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        var name = request.Name?.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            ModelState.AddModelError(
                nameof(request.Name),
                "Contact name is required.");

            return ValidationProblem(ModelState);
        }


if (!VendorPhoneNumber.TryNormalize(
    request.Phone,
    out var normalizedPhone))
{
    ModelState.AddModelError(
        nameof(request.Phone),
        "Enter a valid 10-digit North American phone number with an optional +1 country code.");

    return ValidationProblem(ModelState);
}


        var vendorExists = await _dbContext.Vendors
            .AnyAsync(
                vendor => vendor.Id == id,
                cancellationToken);

        if (!vendorExists)
        {
            return NotFound();
        }

        var now = DateTimeOffset.UtcNow;

        var contact = new VendorContact
        {
            Id = Guid.NewGuid(),
            VendorId = id,
            Name = name,
            JobTitle = request.JobTitle?.Trim(),
            Email = request.Email?.Trim(),
            Phone = normalizedPhone,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _dbContext.VendorContacts.Add(contact);

        await _dbContext.SaveChangesAsync(
            cancellationToken);


var result = new VendorContactDto
{
    Id = contact.Id,
    VendorId = contact.VendorId,
    Name = contact.Name,
    JobTitle = contact.JobTitle,
    Email = contact.Email,
    Phone = contact.Phone,
    UpdatedAtUtc = contact.UpdatedAtUtc
};


        return StatusCode(
            StatusCodes.Status201Created,
            result);
    }


    // =========================================================
    // GET VENDOR CONTACTS
    // Available to authenticated users.
    // =========================================================

    [HttpGet("{id:guid}/contacts")]
    [ProducesResponseType(
        typeof(IReadOnlyList<VendorContactDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<VendorContactDto>>>
        GetVendorContacts(
            Guid id,
            CancellationToken cancellationToken)
    {
        var vendorExists =
            await _dbContext.Vendors
                .AsNoTracking()
                .AnyAsync(
                    vendor => vendor.Id == id,
                    cancellationToken);

        if (!vendorExists)
        {
            return NotFound();
        }

        var contacts =
            await _dbContext.VendorContacts
                .AsNoTracking()
                .Where(contact => contact.VendorId == id)
                .OrderBy(contact => contact.Name)
                .ThenBy(contact => contact.Id)

.Select(contact => new VendorContactDto
{
    Id = contact.Id,
    VendorId = contact.VendorId,
    Name = contact.Name,
    JobTitle = contact.JobTitle,
    Email = contact.Email,
    Phone = contact.Phone,
    UpdatedAtUtc = contact.UpdatedAtUtc
})

                .ToListAsync(cancellationToken);

        return Ok(contacts);
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