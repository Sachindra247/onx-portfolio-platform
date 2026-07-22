using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Application.Vendors;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Route("api/vendors")]
public sealed class VendorsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public VendorsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<VendorDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<VendorDto>>> GetVendors(
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Vendors.AsNoTracking();

        if (activeOnly)
        {
            query = query.Where(vendor => vendor.IsActive);
        }

        var vendors = await query
            .OrderBy(vendor => vendor.Name)
            .Select(vendor => new VendorDto
            {
                Id = vendor.Id,
                Name = vendor.Name,
                IsActive = vendor.IsActive
            })
            .ToListAsync(cancellationToken);

        return Ok(vendors);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(VendorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VendorDto>> GetVendor(
        Guid id,
        CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .AsNoTracking()
            .Where(vendor => vendor.Id == id)
            .Select(vendor => new VendorDto
            {
                Id = vendor.Id,
                Name = vendor.Name,
                IsActive = vendor.IsActive
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (vendor is null)
        {
            return NotFound();
        }

        return Ok(vendor);
    }
}