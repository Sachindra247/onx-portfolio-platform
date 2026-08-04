using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Application.Certifications;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Route("api/certifications")]
public sealed class CertificationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CertificationsController(
        AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<CertificationDto>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<CertificationDto>>> GetCertifications(
        [FromQuery] string? search,
        [FromQuery] CertificationStatus? status,
        [FromQuery] Guid? vendorId,
        [FromQuery] DateOnly? expiringBefore,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Certifications
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim();

            query = query.Where(certification =>
                certification.PersonName.Contains(
                    normalizedSearch) ||
                certification.CertificationName.Contains(
                    normalizedSearch) ||
                certification.Vendor.Name.Contains(
                    normalizedSearch) ||
                (certification.PracticeLead != null &&
                 certification.PracticeLead.Contains(
                     normalizedSearch)) ||
                (certification.Notes != null &&
                 certification.Notes.Contains(
                     normalizedSearch)));
        }

        if (status.HasValue)
        {
            query = query.Where(certification =>
                certification.Status == status.Value);
        }

        if (vendorId.HasValue)
        {
            query = query.Where(certification =>
                certification.VendorId == vendorId.Value);
        }

        if (expiringBefore.HasValue)
        {
            query = query.Where(certification =>
                certification.ExpiryDate != null &&
                certification.ExpiryDate <=
                expiringBefore.Value);
        }

        var certifications = await query
            .OrderBy(certification =>
                certification.ExpiryDate == null)
            .ThenBy(certification =>
                certification.ExpiryDate)
            .ThenBy(certification =>
                certification.PersonName)
            .Select(certification => new CertificationDto
{
    Id = certification.Id,
    PersonName = certification.PersonName,
    CertificationName =
        certification.CertificationName,
    Status = certification.Status,
    DateCompleted =
        certification.DateCompleted,
    ExpiryDate = certification.ExpiryDate,
    PracticeLead =
        certification.PracticeLead,
    RebateImpact =
        certification.RebateImpact,
    Notes = certification.Notes,
    VendorId = certification.VendorId,
    VendorName = certification.Vendor.Name,
    CreatedAtUtc =
        certification.CreatedAtUtc,
    UpdatedAtUtc =
        certification.UpdatedAtUtc
})
            .ToListAsync(cancellationToken);

        return Ok(certifications);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(
        typeof(CertificationDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CertificationDto>>
        GetCertification(
            Guid id,
            CancellationToken cancellationToken)
    {
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

    [HttpPost]
    [ProducesResponseType(
        typeof(CertificationDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CertificationDto>>
        CreateCertification(
            CreateCertificationRequest request,
            CancellationToken cancellationToken)
    {
        if (!IsValidDateRange(
                request.DateCompleted,
                request.ExpiryDate))
        {
            ModelState.AddModelError(
                nameof(request.ExpiryDate),
                "Expiry date cannot be earlier than the completion date.");

            return ValidationProblem(ModelState);
        }

        var vendorExists = await _dbContext.Vendors
            .AnyAsync(
                vendor =>
                    vendor.Id == request.VendorId &&
                    vendor.IsActive,
                cancellationToken);

        if (!vendorExists)
        {
            ModelState.AddModelError(
                nameof(request.VendorId),
                "The selected vendor does not exist or is inactive.");

            return ValidationProblem(ModelState);
        }

        var now = DateTimeOffset.UtcNow;

        var certification = new Certification
        {
            Id = Guid.NewGuid(),
            PersonName = request.PersonName.Trim(),
            CertificationName =
                request.CertificationName.Trim(),
            Status = request.Status,
            DateCompleted = request.DateCompleted,
            ExpiryDate = request.ExpiryDate,
            PracticeLead = NormalizeOptionalText(
                request.PracticeLead),
            RebateImpact = NormalizeOptionalText(
                request.RebateImpact),
            Notes = NormalizeOptionalText(
                request.Notes),
            VendorId = request.VendorId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _dbContext.Certifications.Add(certification);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        var createdCertification =
            await GetCertificationDtoAsync(
                certification.Id,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetCertification),
            new { id = certification.Id },
            createdCertification);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(
        typeof(CertificationDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CertificationDto>>
        UpdateCertification(
            Guid id,
            UpdateCertificationRequest request,
            CancellationToken cancellationToken)
    {
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

            return ValidationProblem(ModelState);
        }

        var vendorExists = await _dbContext.Vendors
            .AnyAsync(
                vendor =>
                    vendor.Id == request.VendorId &&
                    vendor.IsActive,
                cancellationToken);

        if (!vendorExists)
        {
            ModelState.AddModelError(
                nameof(request.VendorId),
                "The selected vendor does not exist or is inactive.");

            return ValidationProblem(ModelState);
        }

        certification.PersonName =
            request.PersonName.Trim();

        certification.CertificationName =
            request.CertificationName.Trim();

        certification.Status = request.Status;
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
            NormalizeOptionalText(request.Notes);

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

        return Ok(updatedCertification);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult>
        DeleteCertification(
            Guid id,
            CancellationToken cancellationToken)
    {
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

    private async Task<CertificationDto?>
        GetCertificationDtoAsync(
            Guid id,
            CancellationToken cancellationToken)
    {
        return await _dbContext.Certifications
            .AsNoTracking()
            .Where(certification =>
                certification.Id == id)
            .Select(certification => new CertificationDto
{
    Id = certification.Id,
    PersonName = certification.PersonName,
    CertificationName =
        certification.CertificationName,
    Status = certification.Status,
    DateCompleted =
        certification.DateCompleted,
    ExpiryDate = certification.ExpiryDate,
    PracticeLead =
        certification.PracticeLead,
    RebateImpact =
        certification.RebateImpact,
    Notes = certification.Notes,
    VendorId = certification.VendorId,
    VendorName = certification.Vendor.Name,
    CreatedAtUtc =
        certification.CreatedAtUtc,
    UpdatedAtUtc =
        certification.UpdatedAtUtc
})
            .SingleOrDefaultAsync(cancellationToken);
    }

    // private static CertificationDto
    //     MapToDtoExpression(
    //         Certification certification)
    // {
    //     return new CertificationDto
    //     {
    //         Id = certification.Id,
    //         PersonName = certification.PersonName,
    //         CertificationName =
    //             certification.CertificationName,
    //         Status = certification.Status,
    //         DateCompleted =
    //             certification.DateCompleted,
    //         ExpiryDate = certification.ExpiryDate,
    //         PracticeLead =
    //             certification.PracticeLead,
    //         RebateImpact =
    //             certification.RebateImpact,
    //         Notes = certification.Notes,
    //         VendorId = certification.VendorId,
    //         VendorName = certification.Vendor.Name,
    //         CreatedAtUtc =
    //             certification.CreatedAtUtc,
    //         UpdatedAtUtc =
    //             certification.UpdatedAtUtc
    //     };
    // }

    private static bool IsValidDateRange(
        DateOnly? completedDate,
        DateOnly? expiryDate)
    {
        return !completedDate.HasValue ||
               !expiryDate.HasValue ||
               expiryDate.Value >=
               completedDate.Value;
    }

    private static string? NormalizeOptionalText(
        string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}