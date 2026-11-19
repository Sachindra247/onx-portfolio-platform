using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class VendorConfiguration :
    IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.ToTable("Vendors");

        builder.HasKey(vendor => vendor.Id);

        builder.Property(vendor => vendor.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.HasIndex(vendor => vendor.Name)
            .IsUnique();

        builder.Property(vendor => vendor.IsActive)
            .IsRequired();

        builder.Property(vendor => vendor.PartnershipTier)
    .HasMaxLength(100);

builder.Property(vendor => vendor.PartnershipStatus)
    .HasMaxLength(100);

builder.Property(vendor => vendor.PartnershipBenefits)
    .HasMaxLength(4000);

builder.Property(vendor => vendor.PartnerPrograms)
    .HasMaxLength(4000);


builder.Property(vendor => vendor.DiscountPercentage)
    .HasPrecision(5, 2);

builder.Property(vendor => vendor.RebatePercentage)
    .HasPrecision(5, 2);

builder.Property(vendor => vendor.DealRegistrationAvailable)
    .IsRequired(false);

builder.Property(vendor => vendor.DealRegistrationConditions)
    .HasMaxLength(4000);

builder.Property(vendor => vendor.SpiffAvailable)
    .IsRequired(false);


builder.HasOne(vendor => vendor.PrimaryPartnerManager)
    .WithMany()
    .HasForeignKey(vendor => vendor.PrimaryPartnerManagerId)
    .OnDelete(DeleteBehavior.Restrict);
    }
}