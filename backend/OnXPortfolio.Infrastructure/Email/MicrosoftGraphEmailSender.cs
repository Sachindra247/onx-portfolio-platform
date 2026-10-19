using Microsoft.Extensions.Options;
using OnXPortfolio.Application.Email;
using System.Text.Json;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace OnXPortfolio.Infrastructure.Email;

public sealed class MicrosoftGraphEmailSender : IEmailSender
{
    private readonly HttpClient _httpClient;
    private readonly MicrosoftGraphEmailOptions _options;

    public MicrosoftGraphEmailSender(
        HttpClient httpClient,
        IOptions<MicrosoftGraphEmailOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    private async Task<string> GetAccessTokenAsync(
    CancellationToken cancellationToken)
{
    _options.Validate();

    var tokenUrl =
        $"https://login.microsoftonline.com/{Uri.EscapeDataString(_options.TenantId)}/oauth2/v2.0/token";

    using var content = new FormUrlEncodedContent(
        new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["scope"] = "https://graph.microsoft.com/.default",
            ["grant_type"] = "client_credentials"
        });

    using var response = await _httpClient.PostAsync(
        tokenUrl,
        content,
        cancellationToken);

    if (!response.IsSuccessStatusCode)
{
    throw new HttpRequestException(
        "Microsoft Entra authentication failed. " +
        "Verify the tenant, application credentials, " +
        "and required permissions.");
}

    using var json = JsonDocument.Parse(
        await response.Content.ReadAsStringAsync(
            cancellationToken));

    if (!json.RootElement.TryGetProperty(
        "access_token", out var accessToken))
    {
        throw new InvalidOperationException(
            "Microsoft Entra did not return an access token.");
    }

    var token = accessToken.GetString();

if (string.IsNullOrWhiteSpace(token))
{
    throw new InvalidOperationException(
        "Microsoft Entra returned an empty access token.");
}

return token;
}

    public async Task SendAsync(
    string recipientEmail,
    string subject,
    string body,
    CancellationToken cancellationToken = default)
{
    _options.Validate();

    var accessToken = await GetAccessTokenAsync(
        cancellationToken);

    var requestBody = new
    {
        message = new
        {
            subject,
            body = new
            {
                contentType = "Text",
                content = body
            },
            toRecipients = new[]
            {
                new
                {
                    emailAddress = new
                    {
                        address = recipientEmail
                    }
                }
            }
        },
        saveToSentItems = true
    };

    var sender = Uri.EscapeDataString(
        _options.SenderEmail);

    using var request = new HttpRequestMessage(
        HttpMethod.Post,
        $"https://graph.microsoft.com/v1.0/users/{sender}/sendMail");

    request.Headers.Authorization =
        new AuthenticationHeaderValue(
            "Bearer",
            accessToken);

    request.Content = JsonContent.Create(requestBody);

    using var response = await _httpClient.SendAsync(
        request,
        cancellationToken);

    response.EnsureSuccessStatusCode();
}
}