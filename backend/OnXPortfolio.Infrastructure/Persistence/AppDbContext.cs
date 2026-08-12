using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Certifications;
using OnXPortfolio.Domain.Events;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Domain.Vacations;
using OnXPortfolio.Domain.Vendors;

namespace OnXPortfolio.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Event> Events =>
        Set<Event>();

    public DbSet<EventRegistration> EventRegistrations =>
        Set<EventRegistration>();

    public DbSet<Vendor> Vendors =>
        Set<Vendor>();

    public DbSet<Certification> Certifications =>
        Set<Certification>();

    public DbSet<LeaveRequest> LeaveRequests =>
        Set<LeaveRequest>();

    public DbSet<ApplicationUser> ApplicationUsers =>
        Set<ApplicationUser>();

    public DbSet<ApplicationGroup> ApplicationGroups =>
        Set<ApplicationGroup>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(
            modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
    }
}