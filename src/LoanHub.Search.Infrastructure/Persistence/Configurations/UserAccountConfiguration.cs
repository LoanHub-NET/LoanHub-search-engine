namespace LoanHub.Search.Infrastructure.Persistence.Configurations;

using LoanHub.Search.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class UserAccountConfiguration : IEntityTypeConfiguration<UserAccountEntity>
{
    public void Configure(EntityTypeBuilder<UserAccountEntity> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Email).HasMaxLength(200).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(512);
        builder.Property(user => user.Role).HasConversion<int>();
        builder.Property(user => user.FirstName).HasMaxLength(120);
        builder.Property(user => user.LastName).HasMaxLength(120);
        builder.Property(user => user.JobTitle).HasMaxLength(160);
        builder.Property(user => user.Address).HasMaxLength(320);
        builder.Property(user => user.IdDocumentNumber).HasMaxLength(80);
        builder.HasIndex(user => user.Email).IsUnique();

        builder.HasMany(user => user.ExternalIdentities)
            .WithOne(identity => identity.UserAccount)
            .HasForeignKey(identity => identity.UserAccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
