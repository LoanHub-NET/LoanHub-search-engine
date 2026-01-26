using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Infrastructure;
using LoanHub.Search.Infrastructure.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LoanHub.Search.Infrastructure.IntegrationTests;

public sealed class RepositoryIntegrationTests
{
    [Fact]
    public async Task UserRepository_PersistsExternalIdentity()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var context = new ApplicationDbContext(options);
        await context.Database.EnsureCreatedAsync();

        var repository = new UserRepository(context);
        var user = new UserAccount
        {
            Email = "user@example.com",
            Role = UserRole.User,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        user.ExternalIdentities.Add(new ExternalIdentity
        {
            Provider = "local",
            Subject = "user-1"
        });

        await repository.AddAsync(user, CancellationToken.None);
        var loaded = await repository.GetByExternalIdentityAsync("local", "user-1", CancellationToken.None);

        Assert.NotNull(loaded);
        Assert.Equal(user.Email, loaded!.Email);
        Assert.Single(loaded.ExternalIdentities);
    }

    [Fact]
    public async Task ApplicationRepository_AddsStatusHistory()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var context = new ApplicationDbContext(options);
        await context.Database.EnsureCreatedAsync();

        var repository = new ApplicationRepository(context);
        var application = new LoanApplication
        {
            ApplicantEmail = "applicant@example.com",
            ApplicantDetails = new ApplicantDetails("Jane", "Doe", 30, "Analyst", "Street 1", "ID-1"),
            OfferSnapshot = new OfferSnapshot("MockBank", "MB-10", 220.5m, 0.08m, 13230m, 10000m, 60, DateTimeOffset.UtcNow.AddDays(10))
        };
        application.AddStatus(ApplicationStatus.PreliminarilyAccepted, "Ready");

        await repository.AddAsync(application, CancellationToken.None);
        var loaded = await repository.GetAsync(application.Id, CancellationToken.None);

        Assert.NotNull(loaded);
        Assert.Equal(application.ApplicantEmail, loaded!.ApplicantEmail);
        Assert.NotEmpty(loaded.StatusHistory);
    }

    [Fact]
    public async Task OfferSelectionRepository_UpdatesRecalculatedOffer()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var context = new ApplicationDbContext(options);
        await context.Database.EnsureCreatedAsync();

        var repository = new OfferSelectionRepository(context);
        var selection = new OfferSelection
        {
            InquiryId = Guid.NewGuid(),
            SelectedOffer = new OfferSnapshot("MockBank", "MB-20", 210m, 0.07m, 12500m, 9000m, 48, DateTimeOffset.UtcNow.AddDays(14)),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await repository.AddAsync(selection, CancellationToken.None);

        selection.ApplyRecalculation(
            new OfferSnapshot("MockBank", "MB-20-R", 205m, 0.07m, 12300m, 9000m, 48, DateTimeOffset.UtcNow.AddDays(14)),
            6000m,
            2500m,
            2);

        await repository.UpdateAsync(selection, CancellationToken.None);

        var loaded = await repository.GetAsync(selection.Id, CancellationToken.None);

        Assert.NotNull(loaded);
        Assert.NotNull(loaded!.RecalculatedOffer);
        Assert.Equal("MB-20-R", loaded.RecalculatedOffer!.ProviderOfferId);
        Assert.Equal(2, loaded.Dependents);
    }
}
