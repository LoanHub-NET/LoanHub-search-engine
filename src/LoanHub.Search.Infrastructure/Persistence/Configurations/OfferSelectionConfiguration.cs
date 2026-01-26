namespace LoanHub.Search.Infrastructure.Persistence.Configurations;

using LoanHub.Search.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class OfferSelectionConfiguration : IEntityTypeConfiguration<OfferSelectionEntity>
{
    public void Configure(EntityTypeBuilder<OfferSelectionEntity> builder)
    {
        builder.ToTable("OfferSelections");
        builder.HasKey(selection => selection.Id);
        builder.HasIndex(selection => selection.InquiryId);
        builder.HasIndex(selection => selection.ApplicationId);

        builder.OwnsOne(selection => selection.SelectedOffer, snapshot =>
        {
            snapshot.Property(s => s.Provider).HasMaxLength(120).HasColumnName("SelectedOfferProvider");
            snapshot.Property(s => s.ProviderOfferId).HasMaxLength(120).HasColumnName("SelectedOfferProviderOfferId");
            snapshot.Property(s => s.Installment).HasColumnName("SelectedOfferInstallment");
            snapshot.Property(s => s.Apr).HasColumnName("SelectedOfferApr");
            snapshot.Property(s => s.TotalCost).HasColumnName("SelectedOfferTotalCost");
            snapshot.Property(s => s.Amount).HasColumnName("SelectedOfferAmount");
            snapshot.Property(s => s.DurationMonths).HasColumnName("SelectedOfferDurationMonths");
            snapshot.Property(s => s.ValidUntil).HasColumnName("SelectedOfferValidUntil");
        });

        builder.OwnsOne(selection => selection.RecalculatedOffer, snapshot =>
        {
            snapshot.Property(s => s.Provider).HasMaxLength(120).HasColumnName("RecalculatedOfferProvider");
            snapshot.Property(s => s.ProviderOfferId).HasMaxLength(120).HasColumnName("RecalculatedOfferProviderOfferId");
            snapshot.Property(s => s.Installment).HasColumnName("RecalculatedOfferInstallment");
            snapshot.Property(s => s.Apr).HasColumnName("RecalculatedOfferApr");
            snapshot.Property(s => s.TotalCost).HasColumnName("RecalculatedOfferTotalCost");
            snapshot.Property(s => s.Amount).HasColumnName("RecalculatedOfferAmount");
            snapshot.Property(s => s.DurationMonths).HasColumnName("RecalculatedOfferDurationMonths");
            snapshot.Property(s => s.ValidUntil).HasColumnName("RecalculatedOfferValidUntil");
        });

        builder.Navigation(selection => selection.RecalculatedOffer).IsRequired(false);
    }
}
