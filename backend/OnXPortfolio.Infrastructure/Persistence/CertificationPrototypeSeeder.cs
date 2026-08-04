using System.Globalization;
using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Infrastructure.Persistence;

public static class CertificationPrototypeSeeder
{
    private const string ResourceName =
        "OnXPortfolio.Infrastructure.Persistence.SeedData.certification-prototype-data.json";

    public static async Task SeedAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        // This is an initial import only.
        // After records exist, deleted records will not be recreated.
        if (await dbContext.Certifications.AnyAsync(cancellationToken))
        {
            return;
        }

        var seedData = await ReadSeedDataAsync(cancellationToken);

        if (seedData.Certifications.Count == 0)
        {
            return;
        }

        var prototypeVendorNames = seedData.Certifications
            .Select(certification => certification.Vendor.Trim())
            .Where(vendorName => vendorName.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingVendors = await dbContext.Vendors
            .ToListAsync(cancellationToken);

        var existingVendorNames = existingVendors
            .Select(vendor => vendor.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var now = DateTimeOffset.UtcNow;

        var missingVendors = prototypeVendorNames
            .Where(vendorName => !existingVendorNames.Contains(vendorName))
            .Select(vendorName => new Vendor
            {
                Id = Guid.NewGuid(),
                Name = vendorName,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            })
            .ToList();

        if (missingVendors.Count > 0)
        {
            dbContext.Vendors.AddRange(missingVendors);
            await dbContext.SaveChangesAsync(cancellationToken);

            existingVendors.AddRange(missingVendors);
        }

        var vendorsByName = existingVendors
            .GroupBy(
                vendor => vendor.Name,
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First(),
                StringComparer.OrdinalIgnoreCase);

        var certifications = new List<Certification>();

        foreach (var source in seedData.Certifications)
        {
            var personName = source.Person.Trim();
            var vendorName = source.Vendor.Trim();
            var certificationName = source.Cert.Trim();

            if (personName.Length == 0 ||
                vendorName.Length == 0 ||
                certificationName.Length == 0)
            {
                continue;
            }

            if (!vendorsByName.TryGetValue(vendorName, out var vendor))
            {
                continue;
            }

            certifications.Add(new Certification
            {
                Id = Guid.NewGuid(),
                PersonName = personName,
                CertificationName = certificationName,
                Status = ParseStatus(source.Status),
                DateCompleted = ParseDate(source.Completed),
                ExpiryDate = ParseDate(source.Expiry),
                PracticeLead = NormalizeOptionalText(source.Lead),
                RebateImpact = NormalizeOptionalText(source.Rebate),
                Notes = NormalizeOptionalText(source.Notes),
                VendorId = vendor.Id,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            });
        }

        if (certifications.Count == 0)
        {
            return;
        }

        dbContext.Certifications.AddRange(certifications);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task<CertificationPrototypeSeedData>
        ReadSeedDataAsync(CancellationToken cancellationToken)
    {
        var assembly = typeof(CertificationPrototypeSeeder).Assembly;

        await using var stream =
            assembly.GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException(
                $"Embedded seed resource '{ResourceName}' was not found.");

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var seedData =
            await JsonSerializer.DeserializeAsync<
                CertificationPrototypeSeedData>(
                stream,
                options,
                cancellationToken);

        return seedData
            ?? throw new InvalidOperationException(
                "The certification prototype seed data could not be read.");
    }

    private static CertificationStatus ParseStatus(string? value)
    {
        return value?.Trim().ToLowerInvariant() switch
        {
            "complete" => CertificationStatus.Complete,
            "in progress" => CertificationStatus.InProgress,
            "pending" => CertificationStatus.Pending,
            "tbd" => CertificationStatus.Tbd,
            "expired" => CertificationStatus.Expired,
            _ => CertificationStatus.Pending
        };
    }

    private static DateOnly? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalizedValue = value.Trim();

        if (normalizedValue.Equals(
                "N/A",
                StringComparison.OrdinalIgnoreCase) ||
            normalizedValue.Equals(
                "TBD",
                StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return DateOnly.TryParseExact(
            normalizedValue,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var parsedDate)
                ? parsedDate
                : null;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    private sealed class CertificationPrototypeSeedData
    {
        public List<PrototypeCertification> Certifications { get; set; } = [];
    }

    private sealed class PrototypeCertification
    {
        public int Id { get; set; }

        public string Person { get; set; } = string.Empty;

        public string Vendor { get; set; } = string.Empty;

        public string Cert { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string Completed { get; set; } = string.Empty;

        public string Expiry { get; set; } = string.Empty;

        public string Lead { get; set; } = string.Empty;

        public string Rebate { get; set; } = string.Empty;

        public string Notes { get; set; } = string.Empty;
    }
}