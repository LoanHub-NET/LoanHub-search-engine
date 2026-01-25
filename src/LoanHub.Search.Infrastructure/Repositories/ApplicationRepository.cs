namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Pagination;
using LoanHub.Search.Infrastructure;
using Microsoft.EntityFrameworkCore;

public sealed class ApplicationRepository : IApplicationRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ApplicationRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public async Task<LoanApplication> AddAsync(LoanApplication application, CancellationToken ct)
    {
        _dbContext.Applications.Add(application);
        await _dbContext.SaveChangesAsync(ct);
        return application;
    }

    public Task<LoanApplication?> GetAsync(Guid id, CancellationToken ct)
        => _dbContext.Applications
            .Include(application => application.StatusHistory)
            .FirstOrDefaultAsync(application => application.Id == id, ct);

    public async Task<IReadOnlyList<LoanApplication>> ListAsync(CancellationToken ct)
        => await _dbContext.Applications
            .AsNoTracking()
            .Include(application => application.StatusHistory)
            .OrderByDescending(application => application.CreatedAt)
            .ToListAsync(ct);

    public async Task<PagedResult<LoanApplication>> ListAdminAsync(ApplicationAdminQuery query, CancellationToken ct)
    {
        var applications = _dbContext.Applications.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.ApplicantEmail))
        {
            var emailFilter = $"%{query.ApplicantEmail.Trim()}%";
            applications = applications.Where(application => EF.Functions.ILike(application.ApplicantEmail, emailFilter));
        }

        if (!string.IsNullOrWhiteSpace(query.Provider))
        {
            var providerFilter = $"%{query.Provider.Trim()}%";
            applications = applications.Where(application => EF.Functions.ILike(application.OfferSnapshot.Provider, providerFilter));
        }

        if (query.Status is not null)
            applications = applications.Where(application => application.Status == query.Status);

        if (query.CreatedFrom is not null)
            applications = applications.Where(application => application.CreatedAt >= query.CreatedFrom);

        if (query.CreatedTo is not null)
            applications = applications.Where(application => application.CreatedAt <= query.CreatedTo);

        var totalCount = await applications.CountAsync(ct);
        var items = await applications
            .OrderByDescending(application => application.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return new PagedResult<LoanApplication>(items, totalCount, query.Page, query.PageSize);
    }

    public async Task<LoanApplication?> UpdateAsync(LoanApplication application, CancellationToken ct)
    {
        var exists = await _dbContext.Applications.AnyAsync(current => current.Id == application.Id, ct);
        if (!exists)
            return null;

        _dbContext.Applications.Update(application);
        await _dbContext.SaveChangesAsync(ct);
        return application;
    }
}
