using LoanHub.Search.Core.Abstractions;
using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Abstractions.Banks;
using LoanHub.Search.Core.Abstractions.Notifications;
using LoanHub.Search.Core.Abstractions.Selections;
using LoanHub.Search.Core.Abstractions.Users;
using LoanHub.Search.Core.Models;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Banks;
using LoanHub.Search.Core.Models.Notifications;
using LoanHub.Search.Core.Models.Pagination;
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

internal sealed class StubLoanOfferProviderRegistry : ILoanOfferProviderRegistry
{
    private readonly IReadOnlyList<ILoanOfferProvider> _providers;

    public StubLoanOfferProviderRegistry(IEnumerable<ILoanOfferProvider> providers)
        => _providers = providers.ToList();

    public Task<IReadOnlyList<ILoanOfferProvider>> GetProvidersAsync(CancellationToken ct)
        => Task.FromResult(_providers);

    public Task<ILoanOfferProvider?> GetProviderAsync(string name, CancellationToken ct)
        => Task.FromResult(_providers.FirstOrDefault(provider =>
            provider.Name.Equals(name, StringComparison.OrdinalIgnoreCase)));
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

    public Task<IReadOnlyList<UserAccount>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct)
    {
        var idSet = new HashSet<Guid>(ids);
        IReadOnlyList<UserAccount> users = _users.Values
            .Where(user => idSet.Contains(user.Id))
            .ToList();
        return Task.FromResult(users);
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

    public Task<UserAccount?> AddExternalIdentityAsync(Guid userId, string provider, string subject, CancellationToken ct)
    {
        if (!_users.TryGetValue(userId, out var user))
            return Task.FromResult<UserAccount?>(null);

        if (user.ExternalIdentities.Any(identity =>
            identity.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase) &&
            identity.Subject.Equals(subject, StringComparison.OrdinalIgnoreCase)))
        {
            return Task.FromResult<UserAccount?>(user);
        }

        user.ExternalIdentities.Add(new ExternalIdentity
        {
            Provider = provider,
            Subject = subject,
            UserAccountId = user.Id
        });

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

internal sealed class InMemoryBankRepository : IBankRepository
{
    private readonly Dictionary<Guid, Bank> _banks = new();
    private readonly List<BankAdmin> _admins = new();

    public Task<Bank?> GetByIdAsync(Guid id, CancellationToken ct)
        => Task.FromResult(_banks.GetValueOrDefault(id));

    public Task<Bank?> GetByNameAsync(string name, CancellationToken ct)
    {
        var bank = _banks.Values.FirstOrDefault(b =>
            b.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(bank);
    }

    public Task<Bank?> GetByProviderNameAsync(string providerName, CancellationToken ct)
        => GetByNameAsync(providerName, ct);

    public Task<Bank> UpsertAsync(Bank bank, CancellationToken ct)
    {
        var existing = _banks.Values.FirstOrDefault(b =>
            b.Name.Equals(bank.Name, StringComparison.OrdinalIgnoreCase));
        if (existing is null)
        {
            _banks[bank.Id] = bank;
            return Task.FromResult(bank);
        }

        existing.ApiBaseUrl = bank.ApiBaseUrl;
        existing.ApiKey = bank.ApiKey;
        return Task.FromResult(existing);
    }

    public Task<BankAdmin?> AddAdminAsync(Guid bankId, Guid userId, CancellationToken ct)
    {
        var existing = _admins.FirstOrDefault(a => a.BankId == bankId && a.UserAccountId == userId);
        if (existing is not null)
            return Task.FromResult<BankAdmin?>(existing);

        var admin = new BankAdmin { BankId = bankId, UserAccountId = userId };
        _admins.Add(admin);
        return Task.FromResult<BankAdmin?>(admin);
    }

    public Task<bool> IsAdminAsync(Guid userId, CancellationToken ct)
        => Task.FromResult(_admins.Any(admin => admin.UserAccountId == userId));

    public Task<IReadOnlyList<Guid>> GetBankIdsForAdminAsync(Guid userId, CancellationToken ct)
        => Task.FromResult<IReadOnlyList<Guid>>(
            _admins.Where(admin => admin.UserAccountId == userId)
                .Select(admin => admin.BankId)
                .Distinct()
                .ToList());
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

    public Task<IReadOnlyList<LoanApplication>> ListByUserIdAsync(Guid userId, CancellationToken ct)
    {
        IReadOnlyList<LoanApplication> results = _storage.Values
            .Where(application => application.UserId == userId)
            .ToList();

        return Task.FromResult(results);
    }

    public Task<PagedResult<LoanApplication>> ListAdminAsync(ApplicationAdminQuery query, CancellationToken ct)
    {
        var normalized = query.Normalize();
        if (normalized.BankIds is { Count: 0 })
        {
            return Task.FromResult(new PagedResult<LoanApplication>(
                Array.Empty<LoanApplication>(),
                normalized.Page,
                normalized.PageSize,
                0));
        }

        IEnumerable<LoanApplication> applications = _storage.Values;

        if (!string.IsNullOrWhiteSpace(normalized.ApplicantEmail))
        {
            applications = applications.Where(application =>
                application.ApplicantEmail.Contains(normalized.ApplicantEmail, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(normalized.Provider))
        {
            applications = applications.Where(application =>
                application.OfferSnapshot.Provider.Contains(normalized.Provider, StringComparison.OrdinalIgnoreCase));
        }

        if (normalized.Status is not null)
            applications = applications.Where(application => application.Status == normalized.Status);

        if (normalized.CreatedFrom is not null)
            applications = applications.Where(application => application.CreatedAt >= normalized.CreatedFrom);

        if (normalized.CreatedTo is not null)
            applications = applications.Where(application => application.CreatedAt <= normalized.CreatedTo);

        if (normalized.UpdatedFrom is not null)
            applications = applications.Where(application => application.UpdatedAt >= normalized.UpdatedFrom);

        if (normalized.UpdatedTo is not null)
            applications = applications.Where(application => application.UpdatedAt <= normalized.UpdatedTo);

        if (normalized.BankIds is { Count: > 0 })
        {
            applications = applications.Where(application =>
                application.BankId.HasValue && normalized.BankIds.Contains(application.BankId.Value));
        }

        var ordered = applications.OrderByDescending(application => application.CreatedAt).ToList();
        var totalCount = ordered.Count;
        var items = ordered
            .Skip((normalized.Page - 1) * normalized.PageSize)
            .Take(normalized.PageSize)
            .ToList();

        return Task.FromResult(new PagedResult<LoanApplication>(items, normalized.Page, normalized.PageSize, totalCount));
    }

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

internal sealed class StubContractStorage : IContractStorage
{
    public List<(Guid ApplicationId, string FileName, string? ContentType)> Uploads { get; } = new();

    public Task<StoredContract> UploadSignedContractAsync(
        Guid applicationId,
        Stream content,
        string fileName,
        string? contentType,
        CancellationToken ct)
    {
        Uploads.Add((applicationId, fileName, contentType));
        var blobName = $"{applicationId:N}/stub-{Guid.NewGuid():N}";
        return Task.FromResult(new StoredContract(blobName, Path.GetFileName(fileName), contentType));
    }
}

internal sealed class StubDocumentStorage : IDocumentStorage
{
    public Task<StoredDocument> UploadDocumentAsync(
        Guid applicationId,
        Stream content,
        string fileName,
        string? contentType,
        DocumentType documentType,
        DocumentSide side,
        CancellationToken ct)
    {
        var stored = new StoredDocument(
            $"{applicationId:N}/stub-{Guid.NewGuid():N}",
            Path.GetFileName(fileName),
            contentType ?? "application/octet-stream",
            documentType,
            side,
            0,
            DateTimeOffset.UtcNow);
        return Task.FromResult(stored);
    }

    public Task<IReadOnlyList<StoredDocument>> ListDocumentsAsync(Guid applicationId, CancellationToken ct)
        => Task.FromResult<IReadOnlyList<StoredDocument>>(Array.Empty<StoredDocument>());

    public Task<IReadOnlyList<StoredDocument>> CopyDocumentsAsync(
        Guid targetApplicationId,
        IReadOnlyList<string> sourceBlobNames,
        CancellationToken ct)
        => Task.FromResult<IReadOnlyList<StoredDocument>>(Array.Empty<StoredDocument>());

    public Task<string?> GetDocumentUrlAsync(string blobName, TimeSpan validFor, CancellationToken ct)
        => Task.FromResult<string?>(null);

    public Task<Stream?> DownloadDocumentAsync(string blobName, CancellationToken ct)
        => Task.FromResult<Stream?>(null);

    public Task<bool> DeleteDocumentAsync(string blobName, CancellationToken ct)
        => Task.FromResult(false);
}

internal sealed class StubContractDocumentGenerator : IContractDocumentGenerator
{
    public ContractDocument GeneratePreliminaryContract(LoanApplication application)
        => new($"contract-{application.Id}.txt", "text/plain", "stub"u8.ToArray());
}

internal sealed class StubContractLinkGenerator : IContractLinkGenerator
{
    public string GetContractLink(Guid applicationId)
        => $"https://example.test/contracts/{applicationId}";
}

internal sealed class StubEmailTemplateRenderer : IEmailTemplateRenderer
{
    public string Render(string template, IReadOnlyDictionary<string, string> tokens)
        => template;
}

internal sealed class StaticProviderContactResolver : IProviderContactResolver
{
    private readonly Dictionary<string, string?> _emails;

    public StaticProviderContactResolver(Dictionary<string, string?> emails)
    {
        _emails = emails;
    }

    public string? GetContactEmail(LoanApplication application)
    {
        if (application is null)
            return null;

        var provider = application.OfferSnapshot.Provider;
        return _emails.TryGetValue(provider, out var email) ? email : null;
    }
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
