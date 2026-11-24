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

        // =========================================================
    // VENDOR ACTIVITY PROJECTION
    // =========================================================

    private static readonly Expression<Func<VendorActivity, VendorActivityDto>>
        VendorActivityProjection = activity => new VendorActivityDto
        {
            Id = activity.Id,
            VendorId = activity.VendorId,
            Title = activity.Title,
            ActivityDate = activity.ActivityDate,
            Notes = activity.Notes,
            CreatedByUserId = activity.CreatedByUserId,
            CreatedByName =
                activity.CreatedByUser.FirstName + " " +
                activity.CreatedByUser.LastName,
            CreatedAtUtc = activity.CreatedAtUtc,
            UpdatedAtUtc = activity.UpdatedAtUtc
        };


    // =========================================================
    // GET VENDOR ACTIVITIES
    // =========================================================

    [HttpGet("{id:guid}/activities")]
    [ProducesResponseType(
        typeof(IReadOnlyList<VendorActivityDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<VendorActivityDto>>>
        GetVendorActivities(
            Guid id,
            CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null || !currentUser.IsActive)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
{
    return Forbid();
}

        var vendorExists = await _dbContext.Vendors
            .AsNoTracking()
            .AnyAsync(
                vendor => vendor.Id == id,
                cancellationToken);

        if (!vendorExists)
        {
            return NotFound();
        }

        var activities = await _dbContext.VendorActivities
            .AsNoTracking()
            .Where(activity => activity.VendorId == id)
            .OrderByDescending(activity => activity.ActivityDate)
            .ThenByDescending(activity => activity.Id)
            .Select(VendorActivityProjection)
            .ToListAsync(cancellationToken);

        return Ok(activities
            .OrderByDescending(activity => activity.ActivityDate)
            .ThenByDescending(activity => activity.CreatedAtUtc)
            .ThenByDescending(activity => activity.Id)
            .ToList());
    }

        // =========================================================
    // CREATE VENDOR ACTIVITY
    // =========================================================

    [HttpPost("{id:guid}/activities")]
    [ProducesResponseType(
        typeof(VendorActivityDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorActivityDto>>
        CreateVendorActivity(
            Guid id,
            [FromBody] SaveVendorActivityRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null || !currentUser.IsActive)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            ModelState.AddModelError(
                nameof(request.Title),
                "Activity title is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Notes))
        {
            ModelState.AddModelError(
                nameof(request.Notes),
                "Activity notes are required.");
        }

        if (!request.ActivityDate.HasValue)
        {
            ModelState.AddModelError(
                nameof(request.ActivityDate),
                "Activity date is required.");
        }

        if (!ModelState.IsValid)
        {
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

        var activity = new VendorActivity
        {
            Id = Guid.NewGuid(),
            VendorId = id,
            Title = request.Title.Trim(),
            ActivityDate = request.ActivityDate!.Value,
            Notes = request.Notes.Trim(),
            CreatedByUserId = currentUser.Id,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _dbContext.VendorActivities.Add(activity);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var result = await _dbContext.VendorActivities
            .AsNoTracking()
            .Where(item => item.Id == activity.Id)
            .Select(VendorActivityProjection)
            .SingleAsync(cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            result);
    }

        // =========================================================
    // UPDATE VENDOR ACTIVITY
    // =========================================================

    [HttpPut("{id:guid}/activities/{activityId:guid}")]
    [ProducesResponseType(
        typeof(VendorActivityDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorActivityDto>>
        UpdateVendorActivity(
            Guid id,
            Guid activityId,
            [FromBody] SaveVendorActivityRequest request,
            CancellationToken cancellationToken)
    {
        var currentUser = await _currentUserService
            .GetUserAsync(cancellationToken);

        if (currentUser is null || !currentUser.IsActive)
        {
            return Unauthorized();
        }

        if (!CanManageVendors(currentUser))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            ModelState.AddModelError(
                nameof(request.Title),
                "Activity title is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Notes))
        {
            ModelState.AddModelError(
                nameof(request.Notes),
                "Activity notes are required.");
        }

        if (!request.ActivityDate.HasValue)
        {
            ModelState.AddModelError(
                nameof(request.ActivityDate),
                "Activity date is required.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var activity = await _dbContext.VendorActivities
            .SingleOrDefaultAsync(
                item => item.Id == activityId &&
                        item.VendorId == id,
                cancellationToken);

        if (activity is null)
        {
            return NotFound();
        }

        activity.Title = request.Title.Trim();
        activity.ActivityDate = request.ActivityDate!.Value;
        activity.Notes = request.Notes.Trim();
        activity.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var result = await _dbContext.VendorActivities
            .AsNoTracking()
            .Where(item => item.Id == activity.Id)
            .Select(VendorActivityProjection)
            .SingleAsync(cancellationToken);

        return Ok(result);
    }

    // ======================================================
// VENDOR COMPLIANCE REQUIREMENTS
// ======================================================

[HttpGet("{id:guid}/compliance-requirements")]
[ProducesResponseType(
    typeof(IReadOnlyList<VendorComplianceRequirementDto>),
    StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<IReadOnlyList<VendorComplianceRequirementDto>>>
    GetVendorComplianceRequirements(
        Guid id,
        CancellationToken cancellationToken)
{
    var currentUser = await _currentUserService
        .GetUserAsync(cancellationToken);

    if (currentUser is null || !currentUser.IsActive)
    {
        return Unauthorized();
    }

    if (!CanManageVendors(currentUser))
    {
        return Forbid();
    }

    var vendorExists = await _dbContext.Vendors
        .AsNoTracking()
        .AnyAsync(vendor => vendor.Id == id, cancellationToken);

    if (!vendorExists)
    {
        return NotFound();
    }

    var requirements = await _dbContext
        .VendorComplianceRequirements
        .AsNoTracking()
        .Where(item => item.VendorId == id)
        .OrderByDescending(item => item.PeriodStart)
        .ThenBy(item => item.RequirementType)
        .ThenBy(item => item.Name)
        .ToListAsync(cancellationToken);

    return Ok(requirements
        .Select(MapComplianceRequirement)
        .ToList());
}


[HttpPost("{id:guid}/compliance-requirements")]
[ProducesResponseType(
    typeof(VendorComplianceRequirementDto),
    StatusCodes.Status201Created)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<VendorComplianceRequirementDto>>
    CreateVendorComplianceRequirement(
        Guid id,
        [FromBody] SaveVendorComplianceRequirementRequest request,
        CancellationToken cancellationToken)
{
    var currentUser = await _currentUserService
        .GetUserAsync(cancellationToken);

    if (currentUser is null || !currentUser.IsActive)
    {
        return Unauthorized();
    }

    if (!CanManageVendors(currentUser))
    {
        return Forbid();
    }

    ValidateComplianceRequirement(request);

    if (!ModelState.IsValid)
    {
        return ValidationProblem(ModelState);
    }

    var vendorExists = await _dbContext.Vendors
        .AnyAsync(vendor => vendor.Id == id, cancellationToken);

    if (!vendorExists)
    {
        return NotFound();
    }

    var requirement = new VendorComplianceRequirement
    {
        VendorId = id
    };

    ApplyComplianceRequirementValues(requirement, request);

    _dbContext.VendorComplianceRequirements.Add(requirement);

    await _dbContext.SaveChangesAsync(cancellationToken);

    return CreatedAtAction(
        nameof(GetVendorComplianceRequirements),
        new { id },
        MapComplianceRequirement(requirement));
}


[HttpPut("{id:guid}/compliance-requirements/{requirementId:guid}")]
[ProducesResponseType(
    typeof(VendorComplianceRequirementDto),
    StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<VendorComplianceRequirementDto>>
    UpdateVendorComplianceRequirement(
        Guid id,
        Guid requirementId,
        [FromBody] SaveVendorComplianceRequirementRequest request,
        CancellationToken cancellationToken)
{
    var currentUser = await _currentUserService
        .GetUserAsync(cancellationToken);

    if (currentUser is null || !currentUser.IsActive)
    {
        return Unauthorized();
    }

    if (!CanManageVendors(currentUser))
    {
        return Forbid();
    }

    ValidateComplianceRequirement(request);

    if (!ModelState.IsValid)
    {
        return ValidationProblem(ModelState);
    }

    var requirement = await _dbContext
        .VendorComplianceRequirements
        .SingleOrDefaultAsync(
            item => item.Id == requirementId &&
                    item.VendorId == id,
            cancellationToken);

    if (requirement is null)
    {
        return NotFound();
    }

    ApplyComplianceRequirementValues(requirement, request);

    await _dbContext.SaveChangesAsync(cancellationToken);

    return Ok(MapComplianceRequirement(requirement));
}


// ======================================================
// VENDOR COMPLIANCE VALIDATION
// ======================================================

private void ValidateComplianceRequirement(
    SaveVendorComplianceRequirementRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        ModelState.AddModelError(
            nameof(request.Name),
            "Requirement name is required.");
    }

    if (!request.RequirementType.HasValue ||
        !Enum.IsDefined(
            typeof(VendorComplianceRequirementType),
            request.RequirementType.Value))
    {
        ModelState.AddModelError(
            nameof(request.RequirementType),
            "A valid requirement type is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Unit))
    {
        ModelState.AddModelError(
            nameof(request.Unit),
            "Measurement unit is required.");
    }

    if (!request.TargetValue.HasValue ||
        request.TargetValue.Value <= 0)
    {
        ModelState.AddModelError(
            nameof(request.TargetValue),
            "Target value must be greater than zero.");
    }

    if (request.ActualValue.HasValue &&
        request.ActualValue.Value < 0)
    {
        ModelState.AddModelError(
            nameof(request.ActualValue),
            "Actual value cannot be negative.");
    }

    if (request.TargetValue.HasValue &&
        decimal.Round(request.TargetValue.Value, 2) !=
        request.TargetValue.Value)
    {
        ModelState.AddModelError(
            nameof(request.TargetValue),
            "Target value supports up to two decimal places.");
    }

    if (request.ActualValue.HasValue &&
        decimal.Round(request.ActualValue.Value, 2) !=
        request.ActualValue.Value)
    {
        ModelState.AddModelError(
            nameof(request.ActualValue),
            "Actual value supports up to two decimal places.");
    }

    if (!request.PeriodStart.HasValue)
    {
        ModelState.AddModelError(
            nameof(request.PeriodStart),
            "Period start date is required.");
    }

    if (!request.PeriodEnd.HasValue)
    {
        ModelState.AddModelError(
            nameof(request.PeriodEnd),
            "Period end date is required.");
    }

    if (request.PeriodStart.HasValue &&
        request.PeriodEnd.HasValue &&
        request.PeriodEnd.Value < request.PeriodStart.Value)
    {
        ModelState.AddModelError(
            nameof(request.PeriodEnd),
            "Period end cannot be earlier than period start.");
    }
}


// ======================================================
// VENDOR COMPLIANCE MAPPING
// ======================================================

private static void ApplyComplianceRequirementValues(
    VendorComplianceRequirement requirement,
    SaveVendorComplianceRequirementRequest request)
{
    requirement.Name = request.Name.Trim();
    requirement.RequirementType = request.RequirementType!.Value;
    requirement.TargetValue = request.TargetValue!.Value;
    requirement.ActualValue = request.ActualValue;
    requirement.Unit = request.Unit.Trim();
    requirement.PeriodStart = request.PeriodStart!.Value;
    requirement.PeriodEnd = request.PeriodEnd!.Value;

    requirement.Notes = string.IsNullOrWhiteSpace(request.Notes)
        ? null
        : request.Notes.Trim();

    requirement.UpdatedAtUtc = DateTimeOffset.UtcNow;
}


private static VendorComplianceRequirementDto
    MapComplianceRequirement(
        VendorComplianceRequirement requirement)
{
    decimal? achievementPercentage = null;

    if (requirement.ActualValue.HasValue &&
        requirement.TargetValue > 0)
    {
        achievementPercentage = decimal.Round(
            requirement.ActualValue.Value /
            requirement.TargetValue * 100m,
            2,
            MidpointRounding.AwayFromZero);
    }

    return new VendorComplianceRequirementDto
    {
        Id = requirement.Id,
        VendorId = requirement.VendorId,
        Name = requirement.Name,
        RequirementType = requirement.RequirementType,
        TargetValue = requirement.TargetValue,
        ActualValue = requirement.ActualValue,
        Unit = requirement.Unit,
        PeriodStart = requirement.PeriodStart,
        PeriodEnd = requirement.PeriodEnd,
        Notes = requirement.Notes,
        AchievementPercentage = achievementPercentage,
        CreatedAtUtc = requirement.CreatedAtUtc,
        UpdatedAtUtc = requirement.UpdatedAtUtc
    };
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