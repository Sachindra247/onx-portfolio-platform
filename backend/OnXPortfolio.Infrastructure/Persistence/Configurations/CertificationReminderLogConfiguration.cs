using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Certifications;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class CertificationReminderLogConfiguration :
    IEntityTypeConfiguration<CertificationReminderLog>
{
    public void Configure(
        EntityTypeBuilder<CertificationReminderLog> builder)
    {
        builder.ToTable("CertificationReminderLogs");

        builder.HasKey(reminder => reminder.Id);

        builder.Property(reminder => reminder.RecipientEmail)
            .HasMaxLength(320)
            .IsRequired();

        builder.Property(reminder => reminder.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(reminder => reminder.FailureReason)
            .HasMaxLength(2000);

        builder.HasOne(reminder => reminder.Certification)
            .WithMany()
            .HasForeignKey(reminder => reminder.CertificationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(reminder => reminder.CertificationId);

        builder.HasIndex(reminder => reminder.Status);

        builder.HasIndex(reminder => reminder.SentAtUtc);

        builder.HasIndex(reminder => new
        {
            reminder.CertificationId,
            reminder.ExpiryDate,
            reminder.ReminderDays
        })
        .IsUnique();
    }
}