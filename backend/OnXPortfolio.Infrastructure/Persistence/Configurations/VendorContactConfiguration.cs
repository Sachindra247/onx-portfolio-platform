
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class VendorContactConfiguration :
    IEntityTypeConfiguration<VendorContact>
{
    public void Configure(EntityTypeBuilder<VendorContact> builder)
    {
        builder.ToTable("VendorContacts");

        builder.HasKey(contact => contact.Id);

        builder.Property(contact => contact.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(contact => contact.JobTitle)
            .HasMaxLength(150);

        builder.Property(contact => contact.Email)
            .HasMaxLength(254);

        builder.Property(contact => contact.Phone)
            .HasMaxLength(50);

        builder.HasOne(contact => contact.Vendor)
            .WithMany(vendor => vendor.Contacts)
            .HasForeignKey(contact => contact.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(contact => contact.VendorId);
    }
}
