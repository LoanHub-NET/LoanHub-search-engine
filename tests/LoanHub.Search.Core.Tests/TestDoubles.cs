using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Abstractions.Selections;
using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Notifications;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Core.Models.Users;

namespace LoanHub.Search.Core.Tests;

internal sealed class StubLoanOfferProvider : ILoanOfferProvider
{
    private readonly Func<OfferQuery, CancellationToken, Task<IReadOnlyList<OfferDto>>> _handler;

    public StubLoanOfferProvider(string name, Func<OfferQuery, CancellationToken, Task<IReadOnlyList<OfferDto>>> handler)
    {
        Name = name;
        _handler = handler;
    }

    public string Name { get; }

    public Task<IReadOnlyList<OfferDto>> GetOffersAsync(OfferQuery query, CancellationToken ct)
        => _handler(query, ct);
}

internal sealed class InMemoryOfferSelectionRepository : IOfferSelectionRepository
{
    private readonly Dictionary<Guid, OfferSelection> _storage = new();

    public Task<OfferSelection?> GetAsync(Guid id, CancellationToken ct)
    {
        _storage.TryGetValue(id, out var selection);
        return Task.FromResult(selection);
    }

    public Task<OfferSelection> AddAsync(OfferSelection selection, CancellationToken ct)
    {
        _storage[selection.Id] = selection;
        return Task.FromResult(selection);
    }

    public Task<OfferSelection> UpdateAsync(OfferSelection selection, CancellationToken ct)
    {
        _storage[selection.Id] = selection;
        return Task.FromResult(selection);
    }
}

internal sealed class InMemoryUserRepository : IUserRepository
{
    private readonly Dictionary<Guid, UserAccount> _users = new();

    public Task<UserAccount?> GetByIdAsync(Guid id, CancellationToken ct)
        => Task.FromResult(_users.GetValueOrDefault(id));

    public Task<UserAccount?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var user = _users.Values.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<UserAccount?> GetByExternalIdentityAsync(string provider, string subject, CancellationToken ct)
    {
        var user = _users.Values.FirstOrDefault(u =>
            u.ExternalIdentities.Any(identity =>
                identity.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase) &&
                identity.Subject.Equals(subject, StringComparison.OrdinalIgnoreCase)));
        return Task.FromResult(user);
    }

    public Task<UserAccount> AddAsync(UserAccount user, CancellationToken ct)
    {
        _users[user.Id] = user;
        return Task.FromResult(user);
    }

    public Task<UserAccount?> UpdateAsync(UserAccount user, CancellationToken ct)
    {
        _users[user.Id] = user;
        return Task.FromResult<UserAccount?>(user);
    }

    public Task<bool> EmailExistsAsync(string email, CancellationToken ct)
    {
        var exists = _users.Values.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(exists);
    }

    public Task<bool> ExternalIdentityExistsAsync(string provider, string subject, CancellationToken ct)
    {
        var exists = _users.Values.Any(u => u.ExternalIdentities.Any(identity =>
            identity.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase) &&
            identity.Subject.Equals(subject, StringComparison.OrdinalIgnoreCase)));
        return Task.FromResult(exists);
    }
}

internal sealed class InMemoryApplicationRepository : IApplicationRepository
{
    private readonly Dictionary<Guid, LoanApplication> _storage = new();

    public Task<LoanApplication> AddAsync(LoanApplication application, CancellationToken ct)
    {
        _storage[application.Id] = application;
        return Task.FromResult(application);
    }

    public Task<LoanApplication?> GetAsync(Guid id, CancellationToken ct)
    {
        _storage.TryGetValue(id, out var application);
        return Task.FromResult(application);
    }

    public Task<IReadOnlyList<LoanApplication>> ListAsync(CancellationToken ct)
        => Task.FromResult<IReadOnlyList<LoanApplication>>(_storage.Values.ToList());

    public Task<LoanApplication?> UpdateAsync(LoanApplication application, CancellationToken ct)
    {
        _storage[application.Id] = application;
        return Task.FromResult<LoanApplication?>(application);
    }
}

internal sealed class CapturingEmailSender : IEmailSender
{
    public List<EmailMessage> Messages { get; } = new();

    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        Messages.Add(message);
        return Task.CompletedTask;
    }
}

internal sealed class StaticProviderContactResolver : IProviderContactResolver
{
    private readonly Dictionary<string, string?> _emails;

    public StaticProviderContactResolver(Dictionary<string, string?> emails)
    {
        _emails = emails;
    }

    public string? GetContactEmail(string provider)
        => _emails.TryGetValue(provider, out var email) ? email : null;
}

internal sealed class CapturingRealtimeNotifier : IRealtimeNotifier
{
    public List<ApplicationNotification> Notifications { get; } = new();

    public Task NotifyApplicantAsync(ApplicationNotification notification, CancellationToken ct)
    {
        Notifications.Add(notification);
        return Task.CompletedTask;
    }
}
