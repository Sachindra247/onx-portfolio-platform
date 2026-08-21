using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Infrastructure.Persistence;

public static class ApplicationUserSeeder
{
    private sealed record UserSeedData(
        string FirstName,
        string LastName,
        string Email,
        string? ManagerEmail,
        UserRole Role,
        string GroupName,
        ModuleAccess CertificationsAccess,
        ModuleAccess EventsAccess,
        ModuleAccess VacationAccess);

    public static async Task SeedAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        await SeedGroupsAsync(
            dbContext,
            cancellationToken);

        if (await dbContext.ApplicationUsers.AnyAsync(
                cancellationToken))
        {
            return;
        }

        var groups = await dbContext.ApplicationGroups
            .ToDictionaryAsync(
                group => group.Name,
                StringComparer.OrdinalIgnoreCase,
                cancellationToken);

        var now = DateTimeOffset.UtcNow;

        var seedData = GetUsers();

        var usersByEmail =
            new Dictionary<string, ApplicationUser>(
                StringComparer.OrdinalIgnoreCase);

        foreach (var item in seedData)
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                FirstName = item.FirstName.Trim(),
                LastName = item.LastName.Trim(),
                Email = item.Email
                    .Trim()
                    .ToLowerInvariant(),

                Role = item.Role,

                CertificationsAccess =
                    item.CertificationsAccess,

                EventsAccess =
                    item.EventsAccess,

                VacationAccess =
                    item.VacationAccess,

                IsGlobalAdministrator =
                    IsGlobalAdministrator(
                        item.Email),

                IsActive = true,

                // We will enable this when the
                // temporary beta login is added.
                LoginEnabled = false,
                PasswordHash = null,

                GroupId = groups[item.GroupName].Id,

                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            usersByEmail[user.Email] = user;
        }

        // Resolve reporting-manager relationships
        // only after every user has been created.
        foreach (var item in seedData)
        {
            var user =
                usersByEmail[
                    item.Email.ToLowerInvariant()];

            if (string.IsNullOrWhiteSpace(
                    item.ManagerEmail))
            {
                continue;
            }

            var managerEmail =
                item.ManagerEmail
                    .Trim()
                    .ToLowerInvariant();

            // Spreadsheet currently lists Sherif
            // as reporting to himself.
            // Avoid a self-referencing manager record.
            if (managerEmail.Equals(
                    user.Email,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (usersByEmail.TryGetValue(
                    managerEmail,
                    out var manager))
            {
                user.ManagerId = manager.Id;
            }
        }

        dbContext.ApplicationUsers.AddRange(
            usersByEmail.Values);

        await dbContext.SaveChangesAsync(
            cancellationToken);
    }

    private static async Task SeedGroupsAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var groupDefinitions = new[]
        {
            new
            {
                Name = "CX",
                Description =
                    "Customer Experience"
            },
            new
            {
                Name = "SA",
                Description =
                    "Solutions Architecture"
            },
            new
            {
                Name = "ISR",
                Description =
                    "Inside Sales Representatives"
            },
            new
            {
                Name = "All",
                Description =
                    "Cross-group access"
            }
        };

        var existingGroups =
            await dbContext.ApplicationGroups
                .Select(group => group.Name)
                .ToListAsync(cancellationToken);

        var existingGroupSet =
            existingGroups.ToHashSet(
                StringComparer.OrdinalIgnoreCase);

        var now = DateTimeOffset.UtcNow;

        var missingGroups =
            groupDefinitions
                .Where(group =>
                    !existingGroupSet.Contains(
                        group.Name))
                .Select(group =>
                    new ApplicationGroup
                    {
                        Id = Guid.NewGuid(),
                        Name = group.Name,
                        Description =
                            group.Description,
                        IsActive = true,
                        CreatedAtUtc = now,
                        UpdatedAtUtc = now
                    })
                .ToList();

        if (missingGroups.Count == 0)
        {
            return;
        }

        dbContext.ApplicationGroups.AddRange(
            missingGroups);

        await dbContext.SaveChangesAsync(
            cancellationToken);
    }

   private static bool IsGlobalAdministrator(
    string email)
{
    return email.Equals(
               "joel.william@onx.com",
               StringComparison.OrdinalIgnoreCase)
           ||
           email.Equals(
               "srimal.sachindra@onx.com",
               StringComparison.OrdinalIgnoreCase)
           ||
           email.Equals(
               "sherif.mahmoud@onx.com",
               StringComparison.OrdinalIgnoreCase);
}

    private static IReadOnlyList<UserSeedData>
        GetUsers()
    {
        return new List<UserSeedData>
        {
            User(
                "Aashita",
                "Pattni",
                "aashita.pattni@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX"),

            User(
                "AJ",
                "Jabak",
                "aj.jabak@onx.com",
                "joey.doiron@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Alan",
                "Lee",
                "alan.lee@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Avijit",
                "Chowdhury",
                "avijit.chowdhury@onx.com",
                "joey.doiron@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Carol Ann",
                "Mallett",
                "carolann.mallett@onx.com",
                "sherif.mahmoud@onx.com",
                UserRole.Manager,
                "ISR",
                vacation:
                    ModuleAccess.Admin),

            User(
                "Carson",
                "George",
                "carson.george@onx.com",
                "liz.guglietti@onx.com",
                UserRole.Member,
                "ISR"),

            User(
                "Darryl",
                "Cameron",
                "darrly.cameron@onx.com",
                "joey.doiron@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Donna",
                "Bitaxi",
                "donna.bitaxi@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX"),

            User(
                "Enzo",
                "Cappuccitti",
                "enzo.cappuccitti@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Manager,
                "SA",
                vacation:
                    ModuleAccess.Admin),

            User(
                "Glenn",
                "Tonge",
                "glenn.tonge@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Ian",
                "Mcmurray",
                "ian.mcmurray@onx.com",
                "enzo.cappuccitti@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Jawad",
                "Butt",
                "jawad.butt@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Joel",
                "William",
                "joel.william@onx.com",
                "sherif.mahmoud@onx.com",
                UserRole.Manager,
                "CX",
                certifications:
                    ModuleAccess.Admin,
                events:
                    ModuleAccess.Admin,
                vacation:
                    ModuleAccess.Admin),

            User(
                "Joey",
                "Doiron",
                "joey.doiron@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Manager,
                "SA",
                vacation:
                    ModuleAccess.Admin),

            User(
                "Karl",
                "Goddard",
                "karl.goddard@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Kelly",
                "Trinh",
                "kelly.trinh@onx.com",
                "carolann.mallett@onx.com",
                UserRole.Member,
                "ISR"),

            User(
                "Kim",
                "Johannes",
                "johannes.kim@onx.com",
                "liz.guglietti@onx.com",
                UserRole.Member,
                "ISR"),

            User(
                "Lauren",
                "Pereira",
                "lauren.pereira@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX"),

            User(
                "Lisa",
                "Sambleson",
                "lisa.sambleson@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX"),

            User(
                "Liz",
                "Guglietti",
                "liz.guglietti@onx.com",
                "carolann.mallett@onx.com",
                UserRole.Manager,
                "ISR",
                vacation:
                    ModuleAccess.Admin),

            User(
                "Madlyn",
                "Kozak",
                "madlyn.kozak@onx.com",
                "liz.guglietti@onx.com",
                UserRole.Member,
                "ISR"),

            User(
                "Marcel",
                "Morisset",
                "marcel.morisset@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX"),

            User(
                "Mark",
                "Stonebanks",
                "mark.stonebanks@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Matthew",
                "Claridge",
                "matthew.claridge@onx.com",
                "enzo.cappuccitti@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Michael",
                "Goldsmith",
                "michael.goldsmith@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Oswald",
                "Coker",
                "oswald.coker@onx.com",
                "joey.doiron@onx.com",
                UserRole.Member,
                "SA"),

            // Latest instruction:
            // Raed is Certifications Admin.
            User(
                "Raed",
                "Jabak",
                "raed.jabak@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX",
                certifications:
                    ModuleAccess.Admin),

            User(
                "Robert",
                "Payette",
                "robert.payette@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Russell",
                "Lusignan",
                "russell.lusignan@onx.com",
                "sherif.mahmoud@onx.com",
                UserRole.Manager,
                "SA",
                vacation:
                    ModuleAccess.Admin),

            // Latest instruction:
            // Sabrina is Events Admin.
            User(
                "Sabrina",
                "Jubran",
                "sabrina.jubran@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX",
                events:
                    ModuleAccess.Admin),

            User(
                "Sachindra",
                "Senevirathne",
                "srimal.sachindra@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX",
                certifications:
                    ModuleAccess.Admin,
                events:
                    ModuleAccess.Admin,
                vacation:
                    ModuleAccess.Admin),

            User(
                "Sarah",
                "Campbell",
                "sarah.campbell@onx.com",
                "liz.guglietti@onx.com",
                UserRole.Member,
                "ISR"),

            // Sherif has Admin access to all three modules
// and is a Global Administrator.
            User(
                "Sherif",
                "Mahmoud",
                "sherif.mahmoud@onx.com",
                null,
                UserRole.Manager,
                "All",
                certifications:
                    ModuleAccess.Admin,
                events:
                    ModuleAccess.Admin,
                vacation:
                    ModuleAccess.Admin),

            User(
                "Stuart",
                "Foster",
                "stuart.foster@onx.com",
                "joey.doiron@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Tamara",
                "Sigrist",
                "tamara.sigrist@onx.com",
                "liz.guglietti@onx.com",
                UserRole.Member,
                "ISR"),

            User(
                "Tanya",
                "Eades",
                "tanya.eades@onx.com",
                "liz.guglietti@onx.com",
                UserRole.Member,
                "ISR"),

            User(
                "Tim",
                "Lam",
                "tim.lam@onx.com",
                "russell.lusignan@onx.com",
                UserRole.Member,
                "SA"),

            User(
                "Tuyet",
                "Le",
                "tuyet.le@onx.com",
                "liz.guglietti@onx.com",
                UserRole.Member,
                "ISR"),

            User(
                "Zach",
                "Schneider",
                "zach.schneider@onx.com",
                "joel.william@onx.com",
                UserRole.Member,
                "CX")
        };
    }

    private static UserSeedData User(
        string firstName,
        string lastName,
        string email,
        string? managerEmail,
        UserRole role,
        string groupName,
        ModuleAccess certifications =
            ModuleAccess.User,
        ModuleAccess events =
            ModuleAccess.User,
        ModuleAccess vacation =
            ModuleAccess.User)
    {
        return new UserSeedData(
            firstName,
            lastName,
            email,
            managerEmail,
            role,
            groupName,
            certifications,
            events,
            vacation);
    }
}