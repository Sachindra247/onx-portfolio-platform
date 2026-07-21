using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class EventConfiguration :
    IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("Events");

        builder.HasKey(eventRecord => eventRecord.Id);

        builder.Property(eventRecord => eventRecord.Description)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(eventRecord => eventRecord.Stage)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(eventRecord => eventRecord.BudgetCad)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(eventRecord => eventRecord.Notes)
            .HasMaxLength(2000);

        builder.HasOne(eventRecord => eventRecord.Vendor)
            .WithMany(vendor => vendor.Events)
            .HasForeignKey(eventRecord => eventRecord.VendorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(eventRecord => eventRecord.EventDate);

        builder.HasIndex(eventRecord => eventRecord.Stage);

        builder.HasIndex(eventRecord => eventRecord.VendorId);
    }
}