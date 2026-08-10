using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class ApplicationGroupConfiguration
    : IEntityTypeConfiguration<ApplicationGroup>
{
    public void Configure(
        EntityTypeBuilder<ApplicationGroup> builder)
    {
        builder.ToTable("ApplicationGroups");

        builder.HasKey(group => group.Id);

        builder.Property(group => group.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(group => group.Description)
            .HasMaxLength(250);

        builder.HasIndex(group => group.Name)
            .IsUnique();
    }
}