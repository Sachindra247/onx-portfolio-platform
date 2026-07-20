using Microsoft.AspNetCore.Mvc;

namespace OnXPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            application = "OnX Portfolio API",
            timestamp = DateTimeOffset.UtcNow
        });
    }
}