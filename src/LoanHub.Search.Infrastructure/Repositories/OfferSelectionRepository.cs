using LoanHub.Search.Core.Abstractions.Selections;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Infrastructure.Persistence.Mapping;
using Microsoft.EntityFrameworkCore;

namespace LoanHub.Search.Infrastructure.Repositories;

public sealed class OfferSelectionRepository : IOfferSelectionRepository
{
    private readonly ApplicationDbContext _dbContext;

    public OfferSelectionRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public async Task<OfferSelection?> GetAsync(Guid id, CancellationToken ct)
    {
        var entity = await _dbContext.OfferSelections.FirstOrDefaultAsync(selection => selection.Id == id, ct);
        return entity?.ToModel();
    }

    public async Task<OfferSelection> AddAsync(OfferSelection selection, CancellationToken ct)
    {
        var entity = selection.ToEntity();
        _dbContext.OfferSelections.Add(entity);
        await _dbContext.SaveChangesAsync(ct);
        return entity.ToModel();
    }

    public async Task<OfferSelection> UpdateAsync(OfferSelection selection, CancellationToken ct)
    {
        var entity = selection.ToEntity();
        _dbContext.OfferSelections.Update(entity);
        await _dbContext.SaveChangesAsync(ct);
        return entity.ToModel();
    }
}
