using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Notifications;
using LoanHub.Search.Core.Services.Applications;
using Microsoft.Extensions.Options;
using Xunit;

namespace LoanHub.Search.Core.Tests;

public sealed class ApplicationServiceTests
{
    [Fact]
    public async Task CreateAsync_AddsStatusAndSendsEmails()
    {
        var repository = new InMemoryApplicationRepository();
        var contractStorage = new StubContractStorage();
        var contractDocumentGenerator = new StubContractDocumentGenerator();
        var contractLinkGenerator = new StubContractLinkGenerator();
        var emailSender = new CapturingEmailSender();
        var emailTemplateRenderer = new StubEmailTemplateRenderer();
        var resolver = new StaticProviderContactResolver(new Dictionary<string, string?>
        {
            ["ProviderA"] = "provider@example.com"
        });
        var notifier = new CapturingRealtimeNotifier();
        var brandingOptions = Options.Create(new EmailBrandingOptions());

        var service = new ApplicationService(
            repository,
            contractStorage,
            contractDocumentGenerator,
            contractLinkGenerator,
            emailSender,
            emailTemplateRenderer,
            resolver,
            notifier,
            brandingOptions);
        var validUntil = DateTimeOffset.UtcNow.AddDays(10);

        var application = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12, validUntil)
        };

        var created = await service.CreateAsync(application, CancellationToken.None);

        Assert.Equal(ApplicationStatus.New, created.Status);
        Assert.Equal(1, created.StatusHistory.Count);
        Assert.Equal(2, emailSender.Messages.Count);
    }

    [Fact]
    public async Task CancelAsync_DoesNotCancelAcceptedApplication()
    {
        var repository = new InMemoryApplicationRepository();
        var contractStorage = new StubContractStorage();
        var contractDocumentGenerator = new StubContractDocumentGenerator();
        var contractLinkGenerator = new StubContractLinkGenerator();
        var emailSender = new CapturingEmailSender();
        var emailTemplateRenderer = new StubEmailTemplateRenderer();
        var resolver = new StaticProviderContactResolver(new Dictionary<string, string?>());
        var notifier = new CapturingRealtimeNotifier();
        var brandingOptions = Options.Create(new EmailBrandingOptions());
        var service = new ApplicationService(
            repository,
            contractStorage,
            contractDocumentGenerator,
            contractLinkGenerator,
            emailSender,
            emailTemplateRenderer,
            resolver,
            notifier,
            brandingOptions);
        var validUntil = DateTimeOffset.UtcNow.AddDays(10);

        var application = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12, validUntil)
        };
        application.AddStatus(ApplicationStatus.Accepted, null);
        await repository.AddAsync(application, CancellationToken.None);

        var result = await service.CancelAsync(application.Id, CancellationToken.None);

        Assert.Equal(CancellationOutcome.NotAllowed, result.Outcome);
        Assert.NotNull(result.Application);
        Assert.Equal(ApplicationStatus.Accepted, result.Application!.Status);
        Assert.Equal("Nie można zrezygnować po akceptacji wniosku.", result.Message);
    }

    [Fact]
    public async Task CancelAsync_CancelsNewApplication()
    {
        var repository = new InMemoryApplicationRepository();
        var contractStorage = new StubContractStorage();
        var contractDocumentGenerator = new StubContractDocumentGenerator();
        var contractLinkGenerator = new StubContractLinkGenerator();
        var emailSender = new CapturingEmailSender();
        var emailTemplateRenderer = new StubEmailTemplateRenderer();
        var resolver = new StaticProviderContactResolver(new Dictionary<string, string?>());
        var notifier = new CapturingRealtimeNotifier();
        var brandingOptions = Options.Create(new EmailBrandingOptions());
        var service = new ApplicationService(
            repository,
            contractStorage,
            contractDocumentGenerator,
            contractLinkGenerator,
            emailSender,
            emailTemplateRenderer,
            resolver,
            notifier,
            brandingOptions);

        var application = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12, DateTimeOffset.UtcNow.AddDays(30))
        };
        await repository.AddAsync(application, CancellationToken.None);

        var result = await service.CancelAsync(application.Id, CancellationToken.None);

        Assert.Equal(CancellationOutcome.Cancelled, result.Outcome);
        Assert.NotNull(result.Application);
        Assert.Equal(ApplicationStatus.Cancelled, result.Application!.Status);
        Assert.Equal("Wniosek został anulowany.", result.Message);
    }

    [Fact]
    public async Task ListRecentAsync_FiltersByApplicantAndStatus()
    {
        var repository = new InMemoryApplicationRepository();
        var contractStorage = new StubContractStorage();
        var contractDocumentGenerator = new StubContractDocumentGenerator();
        var contractLinkGenerator = new StubContractLinkGenerator();
        var emailSender = new CapturingEmailSender();
        var emailTemplateRenderer = new StubEmailTemplateRenderer();
        var resolver = new StaticProviderContactResolver(new Dictionary<string, string?>());
        var notifier = new CapturingRealtimeNotifier();
        var brandingOptions = Options.Create(new EmailBrandingOptions());
        var service = new ApplicationService(
            repository,
            contractStorage,
            contractDocumentGenerator,
            contractLinkGenerator,
            emailSender,
            emailTemplateRenderer,
            resolver,
            notifier,
            brandingOptions);
        var validUntil = DateTimeOffset.UtcNow.AddDays(10);

        var recent = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12, validUntil),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
        recent.AddStatus(ApplicationStatus.New, null);

        var old = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-2", 100m, 8m, 1200m, 1000m, 12, validUntil),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-10)
        };
        old.AddStatus(ApplicationStatus.Rejected, "Nope");

        await repository.AddAsync(recent, CancellationToken.None);
        await repository.AddAsync(old, CancellationToken.None);

        var results = await service.ListRecentAsync("applicant@example.com", ApplicationStatus.New, 7, CancellationToken.None);

        Assert.Single(results);
        Assert.Equal(recent.Id, results[0].Id);
    }
}
