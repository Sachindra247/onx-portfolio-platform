using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class EventConfiguration :
    IEntityTypeConfiguration<Event>
{
    public void Configure(
        EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("Events");

        builder.HasKey(eventRecord =>
            eventRecord.Id);

        builder.Property(eventRecord =>
                eventRecord.Description)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(eventRecord =>
                eventRecord.Stage)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(eventRecord =>
                eventRecord.ApprovalStatus)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(eventRecord =>
                eventRecord.Venue)
            .HasMaxLength(300);

        builder.Property(eventRecord =>
                eventRecord.BusinessPurpose)
            .HasMaxLength(2000);

        builder.Property(eventRecord =>
                eventRecord.BudgetCad)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(eventRecord =>
                eventRecord.Notes)
            .HasMaxLength(4000);

        builder.Property(eventRecord =>
                eventRecord.ReviewNotes)
            .HasMaxLength(2000);

        builder.HasOne(eventRecord =>
                eventRecord.Vendor)
            .WithMany(vendor =>
                vendor.Events)
            .HasForeignKey(eventRecord =>
                eventRecord.VendorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(eventRecord =>
                eventRecord.SubmittedByUser)
            .WithMany()
            .HasForeignKey(eventRecord =>
                eventRecord.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(eventRecord =>
                eventRecord.ReviewedByUser)
            .WithMany()
            .HasForeignKey(eventRecord =>
                eventRecord.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(eventRecord =>
            eventRecord.EventDate);

        builder.HasIndex(eventRecord =>
            eventRecord.Stage);

        builder.HasIndex(eventRecord =>
            eventRecord.ApprovalStatus);

        builder.HasIndex(eventRecord =>
            eventRecord.VendorId);

        builder.HasIndex(eventRecord =>
            eventRecord.SubmittedByUserId);

        builder.HasIndex(eventRecord =>
            eventRecord.ReviewedByUserId);
    }
}