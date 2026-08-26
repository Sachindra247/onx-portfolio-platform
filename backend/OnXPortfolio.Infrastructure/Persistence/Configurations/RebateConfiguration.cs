using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Rebates;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class RebateConfiguration :
    IEntityTypeConfiguration<Rebate>
{
    public void Configure(
        EntityTypeBuilder<Rebate> builder)
    {
        builder.ToTable("Rebates");

        builder.HasKey(rebate => rebate.Id);

        builder.Property(rebate => rebate.Title)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(rebate => rebate.ProgramName)
            .HasMaxLength(300);

        builder.Property(rebate => rebate.Description)
            .HasMaxLength(3000);

        builder.Property(rebate => rebate.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(rebate => rebate.EstimatedAmount)
            .HasPrecision(18, 2);

        builder.Property(rebate => rebate.ActualAmount)
            .HasPrecision(18, 2);

        builder.Property(rebate => rebate.OwnerName)
            .HasMaxLength(200);

        builder.Property(rebate => rebate.OwnerEmail)
            .HasMaxLength(250);

        builder.Property(rebate => rebate.Notes)
            .HasMaxLength(3000);

        builder.HasOne(rebate => rebate.Vendor)
            .WithMany(vendor => vendor.Rebates)
            .HasForeignKey(rebate => rebate.VendorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(rebate => rebate.Title);

        builder.HasIndex(rebate => rebate.Status);

        builder.HasIndex(rebate => rebate.DueDate);

        builder.HasIndex(rebate => rebate.VendorId);
    }
}