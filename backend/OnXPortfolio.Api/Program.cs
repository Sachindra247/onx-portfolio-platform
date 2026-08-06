using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Vendors;
using OnXPortfolio.Infrastructure.Persistence;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCors";

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://onx-portfolio-platform.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "The DefaultConnection connection string is missing.");

var databaseProvider =
    builder.Configuration["DatabaseProvider"]
    ?? throw new InvalidOperationException(
        "The DatabaseProvider setting is missing.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (databaseProvider.Equals(
            "Postgres",
            StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(connectionString);
    }
    else if (databaseProvider.Equals(
                 "Sqlite",
                 StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        throw new InvalidOperationException(
            $"Unsupported database provider: {databaseProvider}");
    }
});

var app = builder.Build();

app.UseCors(FrontendCorsPolicy);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

   if (databaseProvider.Equals(
        "Sqlite",
        StringComparison.OrdinalIgnoreCase))
{
    await dbContext.Database.EnsureCreatedAsync();
}
else
{
    await dbContext.Database.MigrateAsync();
}

  var vendorNames = new[]
{
    "Cisco",
    "HPE",
    "VMware (Broadcom)",
    "IBM",
    "Red Hat",
    "Nutanix",
    "Dell",
    "Palo Alto Networks",
    "Pure Storage",
    "Cloudflare",
    "Veeam"
};

var existingVendorNames = await dbContext.Vendors
    .Select(v => v.Name)
    .ToListAsync();

var existingVendorNameSet = existingVendorNames
    .ToHashSet(StringComparer.OrdinalIgnoreCase);

var missingVendors = vendorNames
    .Where(name => !existingVendorNameSet.Contains(name))
    .Select(name => new Vendor
    {
        Name = name,
        IsActive = true
    })
    .ToList();

if (missingVendors.Any())
{
    dbContext.Vendors.AddRange(missingVendors);
    await dbContext.SaveChangesAsync();
}

await CertificationPrototypeSeeder.SeedAsync(dbContext);

await VacationPrototypeSeeder.SeedAsync(dbContext);

    if (app.Environment.IsDevelopment())
    {
        await DatabaseSeeder.SeedAsync(dbContext);
    }
}

app.Run();