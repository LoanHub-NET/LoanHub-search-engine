using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Services.Applications;
using Xunit;

namespace LoanHub.Search.Core.Tests;

public sealed class ApplicationServiceTests
{
    [Fact]
    public async Task CreateAsync_AddsStatusAndSendsEmails()
    {
        var repository = new InMemoryApplicationRepository();
        var emailSender = new CapturingEmailSender();
        var resolver = new StaticProviderContactResolver(new Dictionary<string, string?>
        {
            ["ProviderA"] = "provider@example.com"
        });

        var service = new ApplicationService(repository, emailSender, resolver);

        var application = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12)
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
        var emailSender = new CapturingEmailSender();
        var resolver = new StaticProviderContactResolver(new Dictionary<string, string?>());
        var service = new ApplicationService(repository, emailSender, resolver);

        var application = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12)
        };
        application.AddStatus(ApplicationStatus.Accepted, null);
        await repository.AddAsync(application, CancellationToken.None);

        var result = await service.CancelAsync(application.Id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(ApplicationStatus.Accepted, result!.Status);
    }

    [Fact]
    public async Task ListRecentAsync_FiltersByApplicantAndStatus()
    {
        var repository = new InMemoryApplicationRepository();
        var emailSender = new CapturingEmailSender();
        var resolver = new StaticProviderContactResolver(new Dictionary<string, string?>());
        var service = new ApplicationService(repository, emailSender, resolver);

        var recent = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-1", 100m, 8m, 1200m, 1000m, 12),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
        recent.AddStatus(ApplicationStatus.New, null);

        var old = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Engineer", "Main St", "123"),
            OfferSnapshot = new OfferSnapshot("ProviderA", "OFF-2", 100m, 8m, 1200m, 1000m, 12),
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
