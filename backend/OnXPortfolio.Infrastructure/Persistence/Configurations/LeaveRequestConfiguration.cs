using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnXPortfolio.Domain.Vacations;

namespace OnXPortfolio.Infrastructure.Persistence.Configurations;

public sealed class LeaveRequestConfiguration
    : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(
        EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.ToTable("LeaveRequests");

        builder.HasKey(request => request.Id);

        builder.Property(request => request.EmployeeName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(request => request.LeaveType)
            .HasConversion<string>()
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(request => request.Status)
            .HasConversion<string>()
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(request => request.Reason)
            .HasMaxLength(500);

        builder.Property(request => request.ApproverName)
            .HasMaxLength(150);

        builder.Property(request => request.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(request => request.EmployeeName);

        builder.HasIndex(request => request.StartDate);

        builder.HasIndex(request => request.EndDate);

        builder.HasIndex(request => request.Status);
    }
}