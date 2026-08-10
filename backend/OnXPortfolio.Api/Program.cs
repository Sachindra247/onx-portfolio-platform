using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Vendors;
using OnXPortfolio.Infrastructure.Persistence;
using System.Text.Json.Serialization;

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Domain.Users;

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

builder.Services.AddScoped<
    IPasswordHasher<ApplicationUser>,
    PasswordHasher<ApplicationUser>>();

builder.Services.AddScoped<
    JwtTokenService>();

    var jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer is missing.");

var jwtAudience =
    builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience is missing.");

var jwtSigningKey =
    builder.Configuration["Jwt:SigningKey"]
    ?? throw new InvalidOperationException(
        "Jwt:SigningKey is missing.");

builder.Services
    .AddAuthentication(
        JwtBearerDefaults
            .AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                ValidateAudience = true,
                ValidAudience = jwtAudience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtSigningKey)),

                ValidateLifetime = true,
                ClockSkew =
                    TimeSpan.FromMinutes(1)
            };
    });

builder.Services.AddAuthorization();

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<CurrentUserService>();

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
app.UseAuthentication();
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

await ApplicationUserSeeder.SeedAsync(dbContext);

await VacationUserLinkSeeder.SeedAsync(
    dbContext);

var passwordHasher =
    scope.ServiceProvider.GetRequiredService<
        IPasswordHasher<ApplicationUser>>();

await BetaAuthenticationSeeder.SeedAsync(
    dbContext,
    builder.Configuration,
    passwordHasher);

    if (app.Environment.IsDevelopment())
    {
        await DatabaseSeeder.SeedAsync(dbContext);
    }
}

app.Run();