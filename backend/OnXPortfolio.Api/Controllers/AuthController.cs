using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Api.Auth;
using OnXPortfolio.Application.Auth;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<ApplicationUser>
        _passwordHasher;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(
        AppDbContext dbContext,
        IPasswordHasher<ApplicationUser>
            passwordHasher,
        JwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>>
        Login(
            LoginRequest request,
            CancellationToken cancellationToken)
    {
        var normalizedEmail =
            request.Email
                .Trim()
                .ToLowerInvariant();

        var user =
            await _dbContext.ApplicationUsers
                .Include(item => item.Group)
                .Include(item => item.Manager)
                .SingleOrDefaultAsync(
                    item =>
                        item.Email ==
                            normalizedEmail &&
                        item.IsActive,
                    cancellationToken);

        if (
            user is null ||
            !user.LoginEnabled ||
            string.IsNullOrWhiteSpace(
                user.PasswordHash))
        {
            return Unauthorized(
                new
                {
                    message =
                        "Invalid email or password."
                });
        }

        var passwordResult =
            _passwordHasher
                .VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password);

        if (
            passwordResult ==
            PasswordVerificationResult.Failed)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Invalid email or password."
                });
        }

        var token =
            _jwtTokenService.CreateToken(user);

        return Ok(
            new LoginResponse
            {
                AccessToken = token.Token,
                ExpiresAtUtc =
                    token.ExpiresAtUtc,
                User = ToDto(user)
            });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserDto>>
        GetCurrentUser(
            CancellationToken cancellationToken)
    {
        var idValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (
            !Guid.TryParse(
                idValue,
                out var userId))
        {
            return Unauthorized();
        }

        var user =
            await _dbContext.ApplicationUsers
                .AsNoTracking()
                .Include(item => item.Group)
                .Include(item => item.Manager)
                .SingleOrDefaultAsync(
                    item =>
                        item.Id == userId &&
                        item.IsActive,
                    cancellationToken);

        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(ToDto(user));
    }

    private static AuthUserDto ToDto(
        ApplicationUser user)
    {
        return new AuthUserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Role = user.Role.ToString(),
            Group = user.Group.Name,
            CertificationsAccess =
                user.CertificationsAccess
                    .ToString(),
            EventsAccess =
                user.EventsAccess.ToString(),
            VacationAccess =
                user.VacationAccess.ToString(),
            IsGlobalAdministrator =
                user.IsGlobalAdministrator,
            ManagerId = user.ManagerId,
            ManagerName =
                user.Manager is null
                    ? null
                    : $"{user.Manager.FirstName} {user.Manager.LastName}"
        };
    }
}