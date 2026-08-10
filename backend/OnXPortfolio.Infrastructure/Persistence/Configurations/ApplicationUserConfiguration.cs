using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class ApplicationUserConfiguration
    : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(
        EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("ApplicationUsers");

        builder.HasKey(user => user.Id);

        builder.Property(user => user.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(user => user.LastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(user => user.Email)
            .HasMaxLength(250)
            .IsRequired();

        builder.HasIndex(user => user.Email)
            .IsUnique();

        builder.Property(user => user.Role)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(user => user.CertificationsAccess)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(user => user.EventsAccess)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(user => user.VacationAccess)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(user => user.PasswordHash)
            .HasMaxLength(1000);

        builder.HasOne(user => user.Group)
            .WithMany(group => group.Users)
            .HasForeignKey(user => user.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(user => user.Manager)
            .WithMany(manager => manager.DirectReports)
            .HasForeignKey(user => user.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}