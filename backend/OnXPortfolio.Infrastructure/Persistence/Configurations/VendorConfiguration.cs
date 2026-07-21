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
    }
}