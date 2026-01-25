using LoanHub.Search.Core.Abstractions.Selections;
using LoanHub.Search.Core.Models.Selections;
using Microsoft.EntityFrameworkCore;

namespace LoanHub.Search.Infrastructure.Repositories;

public sealed class OfferSelectionRepository : IOfferSelectionRepository
{
    private readonly ApplicationDbContext _dbContext;

    public OfferSelectionRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

    public async Task<OfferSelection?> GetAsync(Guid id, CancellationToken ct)
        => await _dbContext.OfferSelections.FirstOrDefaultAsync(selection => selection.Id == id, ct);

    public async Task<OfferSelection> AddAsync(OfferSelection selection, CancellationToken ct)
    {
        _dbContext.OfferSelections.Add(selection);
        await _dbContext.SaveChangesAsync(ct);
        return selection;
    }

    public async Task<OfferSelection> UpdateAsync(OfferSelection selection, CancellationToken ct)
    {
        _dbContext.OfferSelections.Update(selection);
        await _dbContext.SaveChangesAsync(ct);
        return selection;
    }
}
