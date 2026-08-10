using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using OnXPortfolio.Domain.Users;

namespace OnXPortfolio.Api.Auth;

public sealed class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(
        IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTimeOffset ExpiresAtUtc)
        CreateToken(ApplicationUser user)
    {
        var issuer =
            _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException(
                "Jwt:Issuer is missing.");

        var audience =
            _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException(
                "Jwt:Audience is missing.");

        var signingKey =
            _configuration["Jwt:SigningKey"]
            ?? throw new InvalidOperationException(
                "Jwt:SigningKey is missing.");

        var expiryHours =
            _configuration.GetValue<int>(
                "Jwt:ExpiryHours",
                8);

        var expiresAtUtc =
            DateTimeOffset.UtcNow.AddHours(
                expiryHours);

        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                user.Id.ToString()),

            new(
                JwtRegisteredClaimNames.Email,
                user.Email),

            new(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()),

            new(
                ClaimTypes.Name,
                $"{user.FirstName} {user.LastName}"),

            new(
                "group",
                user.Group.Name),

            new(
                "org_role",
                user.Role.ToString()),

            new(
                "certifications_access",
                user.CertificationsAccess.ToString()),

            new(
                "events_access",
                user.EventsAccess.ToString()),

            new(
                "vacation_access",
                user.VacationAccess.ToString()),

            new(
                "global_admin",
                user.IsGlobalAdministrator
                    ? "true"
                    : "false")
        };

        var securityKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    signingKey));

        var credentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires:
                expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        return (
            new JwtSecurityTokenHandler()
                .WriteToken(token),
            expiresAtUtc);
    }
}