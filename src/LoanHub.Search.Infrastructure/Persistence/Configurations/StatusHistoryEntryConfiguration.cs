namespace LoanHub.Search.Infrastructure.Persistence.Configurations;

using LoanHub.Search.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class StatusHistoryEntryConfiguration : IEntityTypeConfiguration<StatusHistoryEntryEntity>
{
    public void Configure(EntityTypeBuilder<StatusHistoryEntryEntity> builder)
    {
        builder.ToTable("ApplicationStatusHistory");
        builder.HasKey(history => history.Id);
        builder.Property(history => history.Id).ValueGeneratedOnAdd();
        builder.Property(history => history.Status).HasConversion<int>();
        builder.Property(history => history.Reason).HasMaxLength(320);
        builder.HasIndex(history => history.LoanApplicationId);
    }
}
