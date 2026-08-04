using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Certifications;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class CertificationConfiguration :
    IEntityTypeConfiguration<Certification>
{
    public void Configure(
        EntityTypeBuilder<Certification> builder)
    {
        builder.ToTable("Certifications");

        builder.HasKey(certification => certification.Id);

        builder.Property(certification =>
                certification.PersonName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(certification =>
                certification.CertificationName)
            .HasMaxLength(400)
            .IsRequired();

        builder.Property(certification =>
                certification.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(certification =>
                certification.PracticeLead)
            .HasMaxLength(300);

        builder.Property(certification =>
                certification.RebateImpact)
            .HasMaxLength(500);

        builder.Property(certification =>
                certification.Notes)
            .HasMaxLength(3000);

        builder.HasOne(certification =>
                certification.Vendor)
            .WithMany(vendor =>
                vendor.Certifications)
            .HasForeignKey(certification =>
                certification.VendorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(certification =>
            certification.PersonName);

        builder.HasIndex(certification =>
            certification.CertificationName);

        builder.HasIndex(certification =>
            certification.Status);

        builder.HasIndex(certification =>
            certification.ExpiryDate);

        builder.HasIndex(certification =>
            certification.VendorId);
    }
}