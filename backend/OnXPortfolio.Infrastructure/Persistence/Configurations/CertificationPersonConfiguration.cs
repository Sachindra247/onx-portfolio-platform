using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Certifications;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class CertificationPersonConfiguration :
    IEntityTypeConfiguration<CertificationPerson>
{
    public void Configure(
        EntityTypeBuilder<CertificationPerson> builder)
    {
        builder.ToTable(
            "CertificationPeople");

        builder.HasKey(
            person =>
                person.Id);

        builder.Property(
                person =>
                    person.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(
                person =>
                    person.Email)
            .HasMaxLength(320);

        /*
         * One platform account should map to
         * at most one CertificationPerson.
         *
         * Multiple manually entered people can
         * still have ApplicationUserId = null.
         */
        builder.HasIndex(
                person =>
                    person.ApplicationUserId)
            .IsUnique();

        builder.HasIndex(
            person =>
                person.Email);

        builder.HasIndex(
            person =>
                person.Name);

        builder.HasIndex(
            person =>
                person.ManagerPersonId);

        builder.HasOne(
                person =>
                    person.ApplicationUser)
            .WithMany()
            .HasForeignKey(
                person =>
                    person.ApplicationUserId)
            .OnDelete(
                DeleteBehavior.SetNull);

        builder.HasOne(
                person =>
                    person.ManagerPerson)
            .WithMany(
                manager =>
                    manager.DirectReports)
            .HasForeignKey(
                person =>
                    person.ManagerPersonId)
            .OnDelete(
                DeleteBehavior.Restrict);
    }
}