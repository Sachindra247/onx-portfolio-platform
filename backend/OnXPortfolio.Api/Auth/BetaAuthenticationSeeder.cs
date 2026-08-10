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

            // Only create the password once.

            // if (string.IsNullOrWhiteSpace(
            //         user.PasswordHash))
            // {
            //     user.PasswordHash =
            //         passwordHasher.HashPassword(
            //             user,
            //             credential.Password);
            // }

            // user.LoginEnabled = true;
            // user.UpdatedAtUtc =
            //     DateTimeOffset.UtcNow;
            user.PasswordHash =
    passwordHasher.HashPassword(
        user,
        credential.Password);

user.LoginEnabled = true;
user.UpdatedAtUtc =
    DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(
            cancellationToken);
    }
}