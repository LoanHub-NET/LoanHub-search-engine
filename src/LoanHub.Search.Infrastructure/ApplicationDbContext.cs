namespace LoanHub.Search.Infrastructure;

using LoanHub.Search.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<LoanApplicationEntity> Applications => Set<LoanApplicationEntity>();
    public DbSet<UserAccountEntity> Users => Set<UserAccountEntity>();
    public DbSet<ExternalIdentityEntity> ExternalIdentities => Set<ExternalIdentityEntity>();
    public DbSet<OfferSelectionEntity> OfferSelections => Set<OfferSelectionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
