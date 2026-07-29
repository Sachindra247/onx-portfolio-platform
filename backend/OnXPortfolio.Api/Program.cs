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

    if (!await dbContext.Vendors.AnyAsync())
    {
        dbContext.Vendors.AddRange(
            new Vendor
            {
                Name = "Cisco",
                IsActive = true
            },
            new Vendor
            {
                Name = "Microsoft",
                IsActive = true
            },
            new Vendor
            {
                Name = "Dell Technologies",
                IsActive = true
            },
            new Vendor
            {
                Name = "VMware",
                IsActive = true
            },
            new Vendor
            {
                Name = "Nutanix",
                IsActive = true
            }
        );

        await dbContext.SaveChangesAsync();
    }

    if (app.Environment.IsDevelopment())
    {
        await DatabaseSeeder.SeedAsync(dbContext);
    }
}

app.Run();