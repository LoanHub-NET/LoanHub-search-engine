namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Pagination;
using System.Collections.Concurrent;

public sealed class InMemoryApplicationRepository : IApplicationRepository
{
    private readonly ConcurrentDictionary<Guid, LoanApplication> _storage = new();

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
    {
        IReadOnlyList<LoanApplication> results = _storage.Values
            .OrderByDescending(a => a.CreatedAt)
            .ToList();

        return Task.FromResult(results);
    }

    public Task<PagedResult<LoanApplication>> ListAdminAsync(ApplicationAdminQuery query, CancellationToken ct)
    {
        var normalized = query.Normalize();
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
        if (!_storage.ContainsKey(application.Id))
            return Task.FromResult<LoanApplication?>(null);

        _storage[application.Id] = application;
        return Task.FromResult<LoanApplication?>(application);
    }
}
