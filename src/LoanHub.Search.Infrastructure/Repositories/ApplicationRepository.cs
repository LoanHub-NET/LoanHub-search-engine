namespace LoanHub.Search.Infrastructure.Repositories;

using LoanHub.Search.Core.Abstractions.Applications;
using LoanHub.Search.Core.Models.Applications;
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
