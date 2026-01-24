namespace LoanHub.Search.Infrastructure;

using LoanHub.Search.Core.Models.Applications;
using Microsoft.EntityFrameworkCore;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<LoanApplication> Applications => Set<LoanApplication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LoanApplication>(entity =>
        {
            entity.HasKey(application => application.Id);

            entity.Property(application => application.Status)
                .HasConversion<int>();

            entity.OwnsOne(application => application.ApplicantDetails, details =>
            {
                details.Property(d => d.FirstName).HasMaxLength(120);
                details.Property(d => d.LastName).HasMaxLength(120);
                details.Property(d => d.JobTitle).HasMaxLength(160);
                details.Property(d => d.Address).HasMaxLength(320);
                details.Property(d => d.IdDocumentNumber).HasMaxLength(80);
            });

            entity.OwnsOne(application => application.OfferSnapshot, snapshot =>
            {
                snapshot.Property(s => s.Provider).HasMaxLength(120);
                snapshot.Property(s => s.ProviderOfferId).HasMaxLength(120);
            });

            entity.OwnsMany(application => application.StatusHistory, history =>
            {
                history.ToTable("ApplicationStatusHistory");
                history.WithOwner().HasForeignKey("LoanApplicationId");
                history.Property<int>("Id");
                history.HasKey("Id");
                history.Property(entry => entry.Status).HasConversion<int>();
                history.Property(entry => entry.Reason).HasMaxLength(320);
            });
        });
    }
}
