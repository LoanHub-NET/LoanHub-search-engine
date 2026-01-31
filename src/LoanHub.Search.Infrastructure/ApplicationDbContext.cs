namespace LoanHub.Search.Infrastructure;

using LoanHub.Search.Core.Models.Applications;
using LoanHub.Search.Core.Models.Selections;
using LoanHub.Search.Core.Models.Users;
using LoanHub.Search.Core.Models.Banks;
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
    public DbSet<OfferSelection> OfferSelections => Set<OfferSelection>();
    public DbSet<Bank> Banks => Set<Bank>();
    public DbSet<BankAdmin> BankAdmins => Set<BankAdmin>();
    public DbSet<BankApiClient> BankApiClients => Set<BankApiClient>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LoanApplication>(entity =>
        {
            entity.HasKey(application => application.Id);

            entity.HasOne<UserAccount>()
                .WithMany()
                .HasForeignKey(application => application.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(application => application.UserId);

            entity.HasOne<Bank>()
                .WithMany()
                .HasForeignKey(application => application.BankId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(application => application.BankId);

            entity.HasOne<UserAccount>()
                .WithMany()
                .HasForeignKey(application => application.AssignedAdminId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(application => application.AssignedAdminId);

            entity.Property(application => application.Status)
                .HasConversion<int>();
            entity.Property(application => application.SignedContractFileName)
                .HasMaxLength(240);
            entity.Property(application => application.SignedContractBlobName)
                .HasMaxLength(320);
            entity.Property(application => application.SignedContractContentType)
                .HasMaxLength(160);

            entity.OwnsOne(application => application.ApplicantDetails, details =>
            {
                details.Property(d => d.FirstName).HasMaxLength(120);
                details.Property(d => d.LastName).HasMaxLength(120);
                details.Property(d => d.JobTitle).HasMaxLength(160);
                details.Property(d => d.Address).HasMaxLength(320);
                details.Property(d => d.IdDocumentNumber).HasMaxLength(80);
                details.Property(d => d.MonthlyIncome);
                details.Property(d => d.LivingCosts);
                details.Property(d => d.Dependents);
                details.Property(d => d.Phone).HasMaxLength(40);
                details.Property(d => d.DateOfBirth);
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
            entity.Property(user => user.Role).HasConversion<int>();
            entity.Property(user => user.FirstName).HasMaxLength(120);
            entity.Property(user => user.LastName).HasMaxLength(120);
            entity.Property(user => user.JobTitle).HasMaxLength(160);
            entity.Property(user => user.Address).HasMaxLength(320);
            entity.Property(user => user.Phone).HasMaxLength(40);
            entity.Property(user => user.IdDocumentNumber).HasMaxLength(80);
            entity.Property(user => user.BankName).HasMaxLength(200);
            entity.Property(user => user.BankApiEndpoint).HasMaxLength(500);
            entity.Property(user => user.BankApiKey).HasMaxLength(500);
            entity.HasIndex(user => user.Email).IsUnique();
            entity.HasMany(user => user.ExternalIdentities)
                .WithOne(identity => identity.UserAccount)
                .HasForeignKey(identity => identity.UserAccountId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(user => user.BankAdmins)
                .WithOne(admin => admin.UserAccount)
                .HasForeignKey(admin => admin.UserAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Bank>(entity =>
        {
            entity.HasKey(bank => bank.Id);
            entity.Property(bank => bank.Name).HasMaxLength(200).IsRequired();
            entity.Property(bank => bank.ApiBaseUrl).HasMaxLength(500).IsRequired();
            entity.Property(bank => bank.ApiKey).HasMaxLength(500);
            entity.HasIndex(bank => bank.Name).IsUnique();
            entity.HasMany(bank => bank.Admins)
                .WithOne(admin => admin.Bank)
                .HasForeignKey(admin => admin.BankId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BankAdmin>(entity =>
        {
            entity.HasKey(admin => admin.Id);
            entity.HasIndex(admin => new { admin.BankId, admin.UserAccountId }).IsUnique();
        });

        modelBuilder.Entity<ExternalIdentity>(entity =>
        {
            entity.HasKey(identity => identity.Id);
            entity.Property(identity => identity.Provider).HasMaxLength(120).IsRequired();
            entity.Property(identity => identity.Subject).HasMaxLength(200).IsRequired();
            entity.HasIndex(identity => new { identity.Provider, identity.Subject }).IsUnique();
        });

        modelBuilder.Entity<OfferSelection>(entity =>
        {
            entity.HasKey(selection => selection.Id);
            entity.OwnsOne(selection => selection.SelectedOffer, snapshot =>
            {
                snapshot.Property(s => s.Provider).HasMaxLength(120);
                snapshot.Property(s => s.ProviderOfferId).HasMaxLength(120);
            });
            entity.OwnsOne(selection => selection.RecalculatedOffer, snapshot =>
            {
                snapshot.Property(s => s.Provider).HasMaxLength(120);
                snapshot.Property(s => s.ProviderOfferId).HasMaxLength(120);
            });
        });

        modelBuilder.Entity<BankApiClient>(entity =>
        {
            entity.HasKey(client => client.Id);
            entity.Property(client => client.Name).HasMaxLength(200).IsRequired();
            entity.Property(client => client.KeyHash).HasMaxLength(128).IsRequired();
            entity.Property(client => client.IsActive).HasDefaultValue(true);
            entity.HasIndex(client => client.Name);
            entity.HasIndex(client => client.KeyHash).IsUnique();
        });
    }
}
