
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class VendorActivityConfiguration :
    IEntityTypeConfiguration<VendorActivity>
{
    public void Configure(EntityTypeBuilder<VendorActivity> builder)
    {
        builder.ToTable("VendorActivities");

        builder.HasKey(activity => activity.Id);

        builder.Property(activity => activity.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(activity => activity.ActivityDate)
            .IsRequired();

        builder.Property(activity => activity.Notes)
            .HasMaxLength(10000)
            .IsRequired();

        builder.HasOne(activity => activity.Vendor)
            .WithMany(vendor => vendor.Activities)
            .HasForeignKey(activity => activity.VendorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(activity => activity.CreatedByUser)
            .WithMany()
            .HasForeignKey(activity => activity.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(activity => new
        {
            activity.VendorId,
            activity.ActivityDate
        });

        builder.HasIndex(activity => activity.CreatedByUserId);
    }
}
