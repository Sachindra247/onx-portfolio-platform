using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Auth;

public static class BetaAuthenticationSeeder
{
    public static async Task SeedAsync(
        AppDbContext dbContext,
        IConfiguration configuration,
        IPasswordHasher<ApplicationUser> passwordHasher,
        CancellationToken cancellationToken = default)
    {
        var credentials = new[]
        {
            new
            {
                Email = "joel.william@onx.com",
                Password =
                    configuration[
                        "BetaAuth:JoelPassword"]
            },

            new
            {
                Email = "srimal.sachindra@onx.com",
                Password =
                    configuration[
                        "BetaAuth:SachindraPassword"]
            },

            new
            {
                Email = "sabrina.jubran@onx.com",
                Password =
                    configuration[
                        "BetaAuth:SabrinaPassword"]
            },

            new
            {
                Email = "raed.jabak@onx.com",
                Password =
                    configuration[
                        "BetaAuth:RaedPassword"]
            },

            new
            {
                Email = "sherif.mahmoud@onx.com",
                Password =
                    configuration[
                        "BetaAuth:SherifPassword"]
            }
        };

        foreach (var credential in credentials)
        {
            if (string.IsNullOrWhiteSpace(
                    credential.Password))
            {
                continue;
            }

            var user =
                await dbContext.ApplicationUsers
                    .SingleOrDefaultAsync(
                        item =>
                            item.Email ==
                            credential.Email,
                        cancellationToken);

            if (user is null)
            {
                continue;
            }

            /*
             * Hash the configured beta password.
             *
             * This intentionally refreshes the hash
             * whenever the configured beta password
             * changes.
             */
            user.PasswordHash =
                passwordHasher.HashPassword(
                    user,
                    credential.Password);

            user.LoginEnabled =
                true;

            /*
             * Sherif is now a Global Administrator.
             *
             * Keeping this here is important because
             * ApplicationUserSeeder does not rerun its
             * user creation/update logic once the
             * database already contains users.
             */
            if (user.Email.Equals(
                    "sherif.mahmoud@onx.com",
                    StringComparison.OrdinalIgnoreCase))
            {
                user.IsGlobalAdministrator =
                    true;

                user.Role =
                    UserRole.Manager;

                user.CertificationsAccess =
                    ModuleAccess.Admin;

                user.EventsAccess =
                    ModuleAccess.Admin;

                user.VacationAccess =
                    ModuleAccess.Admin;
            }

            user.UpdatedAtUtc =
                DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(
            cancellationToken);
    }
}