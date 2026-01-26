namespace LoanHub.Search.Infrastructure.Persistence;

using LoanHub.Search.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

public sealed class ApplicationDbSeeder
{
    private readonly ApplicationDbContext _dbContext;

    public ApplicationDbSeeder(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        if (await _dbContext.Users.AnyAsync(ct))
            return;

        var adminUser = new UserAccountEntity
        {
            Id = Guid.NewGuid(),
            Email = "admin@loanhub.local",
            Role = 1,
            FirstName = "Admin",
            LastName = "User",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        adminUser.ExternalIdentities.Add(new ExternalIdentityEntity
        {
            Id = Guid.NewGuid(),
            Provider = "local",
            Subject = "admin",
            UserAccountId = adminUser.Id
        });

        var sampleUser = new UserAccountEntity
        {
            Id = Guid.NewGuid(),
            Email = "user@loanhub.local",
            Role = 0,
            FirstName = "Sample",
            LastName = "User",
            Age = 32,
            JobTitle = "Analyst",
            Address = "123 Sample St",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var sampleApplication = new LoanApplicationEntity
        {
            Id = Guid.NewGuid(),
            UserId = sampleUser.Id,
            ApplicantEmail = sampleUser.Email,
            ApplicantDetails = new ApplicantDetailsEntity
            {
                FirstName = sampleUser.FirstName ?? string.Empty,
                LastName = sampleUser.LastName ?? string.Empty,
                Age = sampleUser.Age ?? 0,
                JobTitle = sampleUser.JobTitle ?? string.Empty,
                Address = sampleUser.Address ?? string.Empty,
                IdDocumentNumber = "ID-12345"
            },
            OfferSnapshot = new OfferSnapshotEntity
            {
                Provider = "MockBank",
                ProviderOfferId = "MB-001",
                Installment = 220.50m,
                Apr = 0.08m,
                TotalCost = 13230m,
                Amount = 10000m,
                DurationMonths = 60,
                ValidUntil = DateTimeOffset.UtcNow.AddDays(30)
            },
            Status = 0,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        sampleApplication.StatusHistory.Add(new StatusHistoryEntryEntity
        {
            Status = 0,
            ChangedAt = sampleApplication.CreatedAt,
            Reason = "Seeded"
        });

        var selection = new OfferSelectionEntity
        {
            Id = Guid.NewGuid(),
            InquiryId = Guid.NewGuid(),
            SelectedOffer = new OfferSnapshotEntity
            {
                Provider = "MockBank",
                ProviderOfferId = "MB-001",
                Installment = 220.50m,
                Apr = 0.08m,
                TotalCost = 13230m,
                Amount = 10000m,
                DurationMonths = 60,
                ValidUntil = DateTimeOffset.UtcNow.AddDays(30)
            },
            ApplicationId = sampleApplication.Id,
            AppliedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Users.AddRange(adminUser, sampleUser);
        _dbContext.Applications.Add(sampleApplication);
        _dbContext.OfferSelections.Add(selection);

        await _dbContext.SaveChangesAsync(ct);
    }
}
