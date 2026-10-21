
using OnXPortfolio.Application.Email;
using OnXPortfolio.Infrastructure.Email;

namespace OnXPortfolio.Tests;

public class RestrictedEmailSenderTests
{
    [Fact]
    public async Task EmptyAllowlist_BlocksAllEmails()
    {
        var fakeSender = new FakeEmailSender();

        var restrictedSender = new RestrictedEmailSender(
            fakeSender,
            Array.Empty<string>());

        await restrictedSender.SendAsync(
            "attendee@example.com",
            "Test Subject",
            "Test Body");

        Assert.Empty(fakeSender.Recipients);
    }


[Fact]
public async Task UnapprovedRecipient_IsBlocked()
{
    var fakeSender = new FakeEmailSender();

    var restrictedSender = new RestrictedEmailSender(
        fakeSender,
        new[] { "approved@example.com" });

    await restrictedSender.SendAsync(
        "unapproved@example.com",
        "Test Subject",
        "Test Body");

    Assert.Empty(fakeSender.Recipients);
}


[Fact]
public async Task ApprovedRecipient_IsAllowed_CaseInsensitive()
{
    var fakeSender = new FakeEmailSender();

    var restrictedSender = new RestrictedEmailSender(
        fakeSender,
        new[] { "approved@example.com" });

    await restrictedSender.SendAsync(
        "APPROVED@EXAMPLE.COM",
        "Test Subject",
        "Test Body");

    Assert.Single(fakeSender.Recipients);

    Assert.Equal(
        "APPROVED@EXAMPLE.COM",
        fakeSender.Recipients[0]);
}



    private sealed class FakeEmailSender : IEmailSender
    {
        public List<string> Recipients { get; } = new();

        public Task SendAsync(
            string recipientEmail,
            string subject,
            string body,
            CancellationToken cancellationToken = default)
        {
            Recipients.Add(recipientEmail);
            return Task.CompletedTask;
        }
    }
}
