namespace LoanHub.Search.Core.Services.Applications;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;

public sealed class ApplicationService
{
    private readonly IApplicationRepository _repo;

    public ApplicationService(IApplicationRepository repo) => _repo = repo;

    public async Task<LoanApplication> CreateAsync(LoanApplication application, CancellationToken ct)
    {
        application.AddStatus(ApplicationStatus.New, null);
        return await _repo.AddAsync(application, ct);
    }

    public Task<LoanApplication?> GetAsync(Guid id, CancellationToken ct)
        => _repo.GetAsync(id, ct);

    public Task<IReadOnlyList<LoanApplication>> ListAsync(CancellationToken ct)
        => _repo.ListAsync(ct);

    public async Task<LoanApplication?> CancelAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        if (application.Status is ApplicationStatus.Accepted)
            return application;

        application.AddStatus(ApplicationStatus.Cancelled, "Cancelled by user");
        return await _repo.UpdateAsync(application, ct);
    }

    public async Task<LoanApplication?> AcceptAsync(Guid id, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.AddStatus(ApplicationStatus.Accepted, null);
        return await _repo.UpdateAsync(application, ct);
    }

    public async Task<LoanApplication?> RejectAsync(Guid id, string reason, CancellationToken ct)
    {
        var application = await _repo.GetAsync(id, ct);
        if (application is null)
            return null;

        application.AddStatus(ApplicationStatus.Rejected, reason);
        return await _repo.UpdateAsync(application, ct);
    }
}
