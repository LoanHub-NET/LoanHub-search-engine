namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
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

    public Task<LoanApplication?> UpdateAsync(LoanApplication application, CancellationToken ct)
    {
        if (!_storage.ContainsKey(application.Id))
            return Task.FromResult<LoanApplication?>(null);

        _storage[application.Id] = application;
        return Task.FromResult<LoanApplication?>(application);
    }
}
