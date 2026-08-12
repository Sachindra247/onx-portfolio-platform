using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Events;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class EventRegistrationConfiguration :
    IEntityTypeConfiguration<EventRegistration>
{
    public void Configure(
        EntityTypeBuilder<EventRegistration> builder)
    {
        builder.ToTable(
            "EventRegistrations");

        builder.HasKey(registration =>
            registration.Id);

        builder.Property(registration =>
                registration.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasOne(registration =>
                registration.Event)
            .WithMany()
            .HasForeignKey(registration =>
                registration.EventId)
            .OnDelete(
                DeleteBehavior.Cascade);

        builder.HasOne(registration =>
                registration.User)
            .WithMany()
            .HasForeignKey(registration =>
                registration.UserId)
            .OnDelete(
                DeleteBehavior.Restrict);

        builder.HasIndex(registration =>
            registration.EventId);

        builder.HasIndex(registration =>
            registration.UserId);

        builder.HasIndex(registration =>
                new
                {
                    registration.EventId,
                    registration.UserId
                })
            .IsUnique();
    }
}