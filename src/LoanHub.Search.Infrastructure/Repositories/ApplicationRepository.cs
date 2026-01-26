namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Pagination;
using LoanHub.Search.Infrastructure.Persistence.Mapping;
using Microsoft.EntityFrameworkCore;

public sealed class ApplicationRepository : IApplicationRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ApplicationRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public async Task<LoanApplication> AddAsync(LoanApplication application, CancellationToken ct)
    {
        var entity = application.ToEntity();
        _dbContext.Applications.Add(entity);
        await _dbContext.SaveChangesAsync(ct);
        return entity.ToModel();
    }

    public async Task<LoanApplication?> GetAsync(Guid id, CancellationToken ct)
    {
        var entity = await _dbContext.Applications
            .Include(application => application.StatusHistory)
            .FirstOrDefaultAsync(application => application.Id == id, ct);

        return entity?.ToModel();
    }

    public async Task<IReadOnlyList<LoanApplication>> ListAsync(CancellationToken ct)
    {
        var entities = await _dbContext.Applications
            .AsNoTracking()
            .Include(application => application.StatusHistory)
            .OrderByDescending(application => application.CreatedAt)
            .ToListAsync(ct);

        return entities.Select(application => application.ToModel()).ToList();
    }

    public async Task<IReadOnlyList<LoanApplication>> ListByUserIdAsync(Guid userId, CancellationToken ct)
    {
        var entities = await _dbContext.Applications
            .AsNoTracking()
            .Include(application => application.StatusHistory)
            .Where(application => application.UserId == userId)
            .OrderByDescending(application => application.CreatedAt)
            .ToListAsync(ct);

        return entities.Select(application => application.ToModel()).ToList();
    }

    public async Task<PagedResult<LoanApplication>> ListAdminAsync(ApplicationAdminQuery query, CancellationToken ct)
    {
        var applications = _dbContext.Applications.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.ApplicantEmail))
        {
            applications = applications.Where(application =>
                EF.Functions.ILike(application.ApplicantEmail, $"%{query.ApplicantEmail}%"));
        }

        if (!string.IsNullOrWhiteSpace(query.Provider))
        {
            applications = applications.Where(application =>
                EF.Functions.ILike(application.OfferSnapshot.Provider, $"%{query.Provider}%"));
        }

        if (query.Status is not null)
            applications = applications.Where(application => application.Status == (int)query.Status);

        if (query.CreatedFrom is not null)
            applications = applications.Where(application => application.CreatedAt >= query.CreatedFrom);

        if (query.CreatedTo is not null)
            applications = applications.Where(application => application.CreatedAt <= query.CreatedTo);

        if (query.UpdatedFrom is not null)
            applications = applications.Where(application => application.UpdatedAt >= query.UpdatedFrom);

        if (query.UpdatedTo is not null)
            applications = applications.Where(application => application.UpdatedAt <= query.UpdatedTo);

        var totalCount = await applications.CountAsync(ct);
        var items = await applications
            .OrderByDescending(application => application.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        var mappedItems = items.Select(application => application.ToModel()).ToList();
        return new PagedResult<LoanApplication>(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<LoanApplication?> UpdateAsync(LoanApplication application, CancellationToken ct)
    {
        var exists = await _dbContext.Applications.AnyAsync(current => current.Id == application.Id, ct);
        if (!exists)
            return null;

        var entity = application.ToEntity();
        _dbContext.Applications.Update(entity);
        await _dbContext.SaveChangesAsync(ct);
        return entity.ToModel();
    }
}
