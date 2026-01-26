namespace LoanHub.Search.Infrastructure.Persistence.Configurations;

using LoanHub.Search.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class LoanApplicationConfiguration : IEntityTypeConfiguration<LoanApplicationEntity>
{
    public void Configure(EntityTypeBuilder<LoanApplicationEntity> builder)
    {
        builder.ToTable("LoanApplications");
        builder.HasKey(application => application.Id);
        builder.Property(application => application.ApplicantEmail).HasMaxLength(200).IsRequired();
        builder.Property(application => application.Status).HasConversion<int>();
        builder.Property(application => application.SignedContractFileName).HasMaxLength(240);
        builder.Property(application => application.SignedContractBlobName).HasMaxLength(320);
        builder.Property(application => application.SignedContractContentType).HasMaxLength(160);

        builder.HasIndex(application => application.UserId);
        builder.HasIndex(application => application.ApplicantEmail);

        builder.HasOne<UserAccountEntity>()
            .WithMany()
            .HasForeignKey(application => application.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.OwnsOne(application => application.ApplicantDetails, details =>
        {
            details.Property(d => d.FirstName).HasMaxLength(120).HasColumnName("ApplicantFirstName");
            details.Property(d => d.LastName).HasMaxLength(120).HasColumnName("ApplicantLastName");
            details.Property(d => d.Age).HasColumnName("ApplicantAge");
            details.Property(d => d.JobTitle).HasMaxLength(160).HasColumnName("ApplicantJobTitle");
            details.Property(d => d.Address).HasMaxLength(320).HasColumnName("ApplicantAddress");
            details.Property(d => d.IdDocumentNumber).HasMaxLength(80).HasColumnName("ApplicantIdDocumentNumber");
        });

        builder.OwnsOne(application => application.OfferSnapshot, snapshot =>
        {
            snapshot.Property(s => s.Provider).HasMaxLength(120).HasColumnName("OfferProvider");
            snapshot.Property(s => s.ProviderOfferId).HasMaxLength(120).HasColumnName("OfferProviderOfferId");
            snapshot.Property(s => s.Installment).HasColumnName("OfferInstallment");
            snapshot.Property(s => s.Apr).HasColumnName("OfferApr");
            snapshot.Property(s => s.TotalCost).HasColumnName("OfferTotalCost");
            snapshot.Property(s => s.Amount).HasColumnName("OfferAmount");
            snapshot.Property(s => s.DurationMonths).HasColumnName("OfferDurationMonths");
            snapshot.Property(s => s.ValidUntil).HasColumnName("OfferValidUntil");
        });

        builder.HasMany(application => application.StatusHistory)
            .WithOne()
            .HasForeignKey(history => history.LoanApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
