namespace LoanHub.Search.Infrastructure.Persistence.Configurations;

using LoanHub.Search.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ExternalIdentityConfiguration : IEntityTypeConfiguration<ExternalIdentityEntity>
{
    public void Configure(EntityTypeBuilder<ExternalIdentityEntity> builder)
    {
        builder.ToTable("ExternalIdentities");
        builder.HasKey(identity => identity.Id);
        builder.Property(identity => identity.Provider).HasMaxLength(120).IsRequired();
        builder.Property(identity => identity.Subject).HasMaxLength(200).IsRequired();
        builder.HasIndex(identity => new { identity.Provider, identity.Subject }).IsUnique();
        builder.HasIndex(identity => identity.UserAccountId);
    }
}
