using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Infrastructure;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;

namespace LoanHub.Search.Infrastructure.Services;

public sealed class ProviderContactResolver : IProviderContactResolver
{
    private readonly ProviderContactOptions _options;
    private readonly ApplicationDbContext _dbContext;

    public ProviderContactResolver(IOptions<ProviderContactOptions> options, ApplicationDbContext dbContext)
    {
        _options = options.Value;
        _dbContext = dbContext;
    }

    public string? GetContactEmail(LoanApplication application)
    {
        if (application is null)
            return null;

        if (application.AssignedAdminId.HasValue)
        {
            var assignedEmail = _dbContext.Users
                .AsNoTracking()
                .Where(user => user.Id == application.AssignedAdminId.Value)
                .Select(user => user.Email)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(assignedEmail))
                return assignedEmail;
        }

        var provider = application.OfferSnapshot.Provider;
        if (!string.IsNullOrWhiteSpace(provider))
        {
            if (_options.Contacts.TryGetValue(provider, out var email))
                return email;
        }

        if (application.BankId.HasValue)
        {
            var adminEmail = _dbContext.BankAdmins
                .AsNoTracking()
                .Where(admin => admin.BankId == application.BankId.Value)
                .OrderBy(admin => admin.AssignedAt)
                .Select(admin => admin.UserAccount!.Email)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(adminEmail))
                return adminEmail;
        }

        if (string.IsNullOrWhiteSpace(provider))
            return null;

        var normalized = provider.Trim();
        if (normalized.Length == 0)
            return null;

        var legacyMatch = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(user =>
                user.Role == UserRole.Admin &&
                user.BankName != null &&
                EF.Functions.ILike(user.BankName, normalized));

        return legacyMatch?.Email;
    }
}
