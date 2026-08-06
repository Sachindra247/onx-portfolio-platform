using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Domain.Events;
using OnXPortfolio.Domain.Vendors;
using OnXPortfolio.Domain.Vacations;

namespace OnXPortfolio.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Event> Events => Set<Event>();

    public DbSet<Vendor> Vendors => Set<Vendor>();

    public DbSet<Certification> Certifications =>
        Set<Certification>();

    public DbSet<LeaveRequest> LeaveRequests =>
    Set<LeaveRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
    }
}