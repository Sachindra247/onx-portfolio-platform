using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class VendorComplianceRequirementConfiguration :
    IEntityTypeConfiguration<VendorComplianceRequirement>
{
    public void Configure(
        EntityTypeBuilder<VendorComplianceRequirement> builder)
    {
        builder.ToTable("VendorComplianceRequirements");

        builder.HasKey(requirement => requirement.Id);

        builder.Property(requirement => requirement.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(requirement => requirement.RequirementType)
            .IsRequired();

        builder.Property(requirement => requirement.TargetValue)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(requirement => requirement.ActualValue)
            .HasPrecision(18, 2);

        builder.Property(requirement => requirement.Unit)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(requirement => requirement.PeriodStart)
            .IsRequired();

        builder.Property(requirement => requirement.PeriodEnd)
            .IsRequired();

        builder.Property(requirement => requirement.Notes)
            .HasMaxLength(10000);

        builder.HasOne(requirement => requirement.Vendor)
            .WithMany(vendor => vendor.ComplianceRequirements)
            .HasForeignKey(requirement => requirement.VendorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(requirement => new
        {
            requirement.VendorId,
            requirement.PeriodStart,
            requirement.PeriodEnd
        });
    }
}