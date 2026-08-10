namespace OnXPortfolio.Application.Auth;

public sealed class LoginResponse
{
    public string AccessToken { get; set; } =
        string.Empty;

    public DateTimeOffset ExpiresAtUtc { get; set; }

    public AuthUserDto User { get; set; } =
        new();
}