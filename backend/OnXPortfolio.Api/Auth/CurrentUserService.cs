using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OnXPortfolio.Domain.Users;
using OnXPortfolio.Infrastructure.Persistence;

namespace OnXPortfolio.Api.Auth;

public sealed class CurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly AppDbContext _dbContext;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor,
        AppDbContext dbContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _dbContext = dbContext;
    }

    public async Task<ApplicationUser?> GetUserAsync(
        CancellationToken cancellationToken = default)
    {
        var principal =
            _httpContextAccessor.HttpContext?.User;

        var userIdValue =
            principal?.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return null;
        }

        return await _dbContext.ApplicationUsers
            .Include(user => user.Group)
            .Include(user => user.Manager)
            .SingleOrDefaultAsync(
                user =>
                    user.Id == userId &&
                    user.IsActive,
                cancellationToken);
    }
}