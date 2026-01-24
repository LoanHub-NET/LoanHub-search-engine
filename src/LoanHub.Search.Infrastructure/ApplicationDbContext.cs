namespace LoanHub.Search.Infrastructure;

using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Users;
using Microsoft.EntityFrameworkCore;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<LoanApplication> Applications => Set<LoanApplication>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();

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

        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(200).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(512);
            entity.Property(user => user.FirstName).HasMaxLength(120);
            entity.Property(user => user.LastName).HasMaxLength(120);
            entity.Property(user => user.JobTitle).HasMaxLength(160);
            entity.Property(user => user.Address).HasMaxLength(320);
            entity.Property(user => user.IdDocumentNumber).HasMaxLength(80);
            entity.HasIndex(user => user.Email).IsUnique();
            entity.HasMany(user => user.ExternalIdentities)
                .WithOne(identity => identity.UserAccount)
                .HasForeignKey(identity => identity.UserAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExternalIdentity>(entity =>
        {
            entity.HasKey(identity => identity.Id);
            entity.Property(identity => identity.Provider).HasMaxLength(120).IsRequired();
            entity.Property(identity => identity.Subject).HasMaxLength(200).IsRequired();
            entity.HasIndex(identity => new { identity.Provider, identity.Subject }).IsUnique();
        });
    }
}
