using LoanHub.Search.Core.Abstractions.Notifications;
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

    public string? GetContactEmail(string provider)
    {
        if (_options.Contacts.TryGetValue(provider, out var email))
            return email;

        if (string.IsNullOrWhiteSpace(provider))
            return null;

        var normalized = provider.Trim();
        if (normalized.Length == 0)
            return null;

        var match = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(user =>
                user.Role == UserRole.Admin &&
                user.BankName != null &&
                EF.Functions.ILike(user.BankName, normalized));

        return match?.Email;
    }
}
