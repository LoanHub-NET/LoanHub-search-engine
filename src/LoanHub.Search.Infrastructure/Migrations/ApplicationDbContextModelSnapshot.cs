using System;
using LoanHub.Search.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace LoanHub.Search.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
public partial class ApplicationDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasAnnotation("ProductVersion", "9.0.0")
            .HasAnnotation("Relational:MaxIdentifierLength", 63);

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.ExternalIdentityEntity", b =>
            {
                b.Property<Guid>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("uuid");

                b.Property<string>("Provider")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)");

                b.Property<string>("Subject")
                    .IsRequired()
                    .HasMaxLength(200)
                    .HasColumnType("character varying(200)");

                b.Property<Guid>("UserAccountId")
                    .HasColumnType("uuid");

                b.HasKey("Id");

                b.HasIndex("Provider", "Subject")
                    .IsUnique();

                b.HasIndex("UserAccountId");

                b.ToTable("ExternalIdentities", (string)null);
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.LoanApplicationEntity", b =>
            {
                b.Property<Guid>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("uuid");

                b.Property<string>("ApplicantEmail")
                    .IsRequired()
                    .HasMaxLength(200)
                    .HasColumnType("character varying(200)");

                b.Property<string>("ApplicantAddress")
                    .IsRequired()
                    .HasMaxLength(320)
                    .HasColumnType("character varying(320)")
                    .HasColumnName("ApplicantAddress");

                b.Property<int>("ApplicantAge")
                    .HasColumnType("integer")
                    .HasColumnName("ApplicantAge");

                b.Property<string>("ApplicantFirstName")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("ApplicantFirstName");

                b.Property<string>("ApplicantIdDocumentNumber")
                    .IsRequired()
                    .HasMaxLength(80)
                    .HasColumnType("character varying(80)")
                    .HasColumnName("ApplicantIdDocumentNumber");

                b.Property<string>("ApplicantJobTitle")
                    .IsRequired()
                    .HasMaxLength(160)
                    .HasColumnType("character varying(160)")
                    .HasColumnName("ApplicantJobTitle");

                b.Property<string>("ApplicantLastName")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("ApplicantLastName");

                b.Property<DateTimeOffset?>("ContractReadyAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<DateTimeOffset>("CreatedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<DateTimeOffset?>("FinalApprovedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<decimal>("OfferAmount")
                    .HasColumnType("numeric")
                    .HasColumnName("OfferAmount");

                b.Property<decimal>("OfferApr")
                    .HasColumnType("numeric")
                    .HasColumnName("OfferApr");

                b.Property<int>("OfferDurationMonths")
                    .HasColumnType("integer")
                    .HasColumnName("OfferDurationMonths");

                b.Property<decimal>("OfferInstallment")
                    .HasColumnType("numeric")
                    .HasColumnName("OfferInstallment");

                b.Property<string>("OfferProvider")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("OfferProvider");

                b.Property<string>("OfferProviderOfferId")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("OfferProviderOfferId");

                b.Property<decimal>("OfferTotalCost")
                    .HasColumnType("numeric")
                    .HasColumnName("OfferTotalCost");

                b.Property<DateTimeOffset>("OfferValidUntil")
                    .HasColumnType("timestamp with time zone")
                    .HasColumnName("OfferValidUntil");

                b.Property<string>("RejectReason")
                    .HasColumnType("text");

                b.Property<DateTimeOffset?>("SignedContractReceivedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<string>("SignedContractBlobName")
                    .HasMaxLength(320)
                    .HasColumnType("character varying(320)");

                b.Property<string>("SignedContractContentType")
                    .HasMaxLength(160)
                    .HasColumnType("character varying(160)");

                b.Property<string>("SignedContractFileName")
                    .HasMaxLength(240)
                    .HasColumnType("character varying(240)");

                b.Property<int>("Status")
                    .HasColumnType("integer");

                b.Property<DateTimeOffset>("UpdatedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<Guid?>("UserId")
                    .HasColumnType("uuid");

                b.HasKey("Id");

                b.HasIndex("ApplicantEmail");

                b.HasIndex("UserId");

                b.ToTable("LoanApplications", (string)null);
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.OfferSelectionEntity", b =>
            {
                b.Property<Guid>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("uuid");

                b.Property<Guid?>("ApplicationId")
                    .HasColumnType("uuid");

                b.Property<DateTimeOffset?>("AppliedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<DateTimeOffset>("CreatedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<int?>("Dependents")
                    .HasColumnType("integer");

                b.Property<decimal?>("Income")
                    .HasColumnType("numeric");

                b.Property<Guid>("InquiryId")
                    .HasColumnType("uuid");

                b.Property<decimal?>("LivingCosts")
                    .HasColumnType("numeric");

                b.Property<decimal?>("RecalculatedOfferAmount")
                    .HasColumnType("numeric")
                    .HasColumnName("RecalculatedOfferAmount");

                b.Property<decimal?>("RecalculatedOfferApr")
                    .HasColumnType("numeric")
                    .HasColumnName("RecalculatedOfferApr");

                b.Property<int?>("RecalculatedOfferDurationMonths")
                    .HasColumnType("integer")
                    .HasColumnName("RecalculatedOfferDurationMonths");

                b.Property<decimal?>("RecalculatedOfferInstallment")
                    .HasColumnType("numeric")
                    .HasColumnName("RecalculatedOfferInstallment");

                b.Property<string>("RecalculatedOfferProvider")
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("RecalculatedOfferProvider");

                b.Property<string>("RecalculatedOfferProviderOfferId")
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("RecalculatedOfferProviderOfferId");

                b.Property<decimal?>("RecalculatedOfferTotalCost")
                    .HasColumnType("numeric")
                    .HasColumnName("RecalculatedOfferTotalCost");

                b.Property<DateTimeOffset?>("RecalculatedOfferValidUntil")
                    .HasColumnType("timestamp with time zone")
                    .HasColumnName("RecalculatedOfferValidUntil");

                b.Property<decimal>("SelectedOfferAmount")
                    .HasColumnType("numeric")
                    .HasColumnName("SelectedOfferAmount");

                b.Property<decimal>("SelectedOfferApr")
                    .HasColumnType("numeric")
                    .HasColumnName("SelectedOfferApr");

                b.Property<int>("SelectedOfferDurationMonths")
                    .HasColumnType("integer")
                    .HasColumnName("SelectedOfferDurationMonths");

                b.Property<decimal>("SelectedOfferInstallment")
                    .HasColumnType("numeric")
                    .HasColumnName("SelectedOfferInstallment");

                b.Property<string>("SelectedOfferProvider")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("SelectedOfferProvider");

                b.Property<string>("SelectedOfferProviderOfferId")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)")
                    .HasColumnName("SelectedOfferProviderOfferId");

                b.Property<decimal>("SelectedOfferTotalCost")
                    .HasColumnType("numeric")
                    .HasColumnName("SelectedOfferTotalCost");

                b.Property<DateTimeOffset>("SelectedOfferValidUntil")
                    .HasColumnType("timestamp with time zone")
                    .HasColumnName("SelectedOfferValidUntil");

                b.Property<DateTimeOffset>("UpdatedAt")
                    .HasColumnType("timestamp with time zone");

                b.HasKey("Id");

                b.HasIndex("ApplicationId");

                b.HasIndex("InquiryId");

                b.ToTable("OfferSelections", (string)null);
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.StatusHistoryEntryEntity", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("integer")
                    .UseIdentityByDefaultColumn();

                b.Property<DateTimeOffset>("ChangedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<Guid>("LoanApplicationId")
                    .HasColumnType("uuid");

                b.Property<string>("Reason")
                    .HasMaxLength(320)
                    .HasColumnType("character varying(320)");

                b.Property<int>("Status")
                    .HasColumnType("integer");

                b.HasKey("Id");

                b.HasIndex("LoanApplicationId");

                b.ToTable("ApplicationStatusHistory", (string)null);
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.UserAccountEntity", b =>
            {
                b.Property<Guid>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("uuid");

                b.Property<int?>("Age")
                    .HasColumnType("integer");

                b.Property<string>("Address")
                    .HasMaxLength(320)
                    .HasColumnType("character varying(320)");

                b.Property<DateTimeOffset>("CreatedAt")
                    .HasColumnType("timestamp with time zone");

                b.Property<string>("Email")
                    .IsRequired()
                    .HasMaxLength(200)
                    .HasColumnType("character varying(200)");

                b.Property<string>("FirstName")
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)");

                b.Property<string>("IdDocumentNumber")
                    .HasMaxLength(80)
                    .HasColumnType("character varying(80)");

                b.Property<string>("JobTitle")
                    .HasMaxLength(160)
                    .HasColumnType("character varying(160)");

                b.Property<string>("LastName")
                    .HasMaxLength(120)
                    .HasColumnType("character varying(120)");

                b.Property<string>("PasswordHash")
                    .HasMaxLength(512)
                    .HasColumnType("character varying(512)");

                b.Property<int>("Role")
                    .HasColumnType("integer");

                b.Property<DateTimeOffset>("UpdatedAt")
                    .HasColumnType("timestamp with time zone");

                b.HasKey("Id");

                b.HasIndex("Email")
                    .IsUnique();

                b.ToTable("Users", (string)null);
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.ExternalIdentityEntity", b =>
            {
                b.HasOne("LoanHub.Search.Infrastructure.Persistence.Entities.UserAccountEntity", "UserAccount")
                    .WithMany("ExternalIdentities")
                    .HasForeignKey("UserAccountId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.Navigation("UserAccount");
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.LoanApplicationEntity", b =>
            {
                b.HasOne("LoanHub.Search.Infrastructure.Persistence.Entities.UserAccountEntity", null)
                    .WithMany()
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.SetNull);

                b.Navigation("ApplicantDetails");

                b.Navigation("OfferSnapshot");

                b.Navigation("StatusHistory");
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.StatusHistoryEntryEntity", b =>
            {
                b.HasOne("LoanHub.Search.Infrastructure.Persistence.Entities.LoanApplicationEntity", null)
                    .WithMany("StatusHistory")
                    .HasForeignKey("LoanApplicationId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.UserAccountEntity", b =>
            {
                b.Navigation("ExternalIdentities");
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.LoanApplicationEntity", b =>
            {
                b.OwnsOne("LoanHub.Search.Infrastructure.Persistence.Entities.ApplicantDetailsEntity", "ApplicantDetails", b1 =>
                    {
                        b1.Property<Guid>("LoanApplicationEntityId")
                            .HasColumnType("uuid");

                        b1.HasKey("LoanApplicationEntityId");

                        b1.ToTable("LoanApplications");

                        b1.WithOwner()
                            .HasForeignKey("LoanApplicationEntityId");
                    });

                b.OwnsOne("LoanHub.Search.Infrastructure.Persistence.Entities.OfferSnapshotEntity", "OfferSnapshot", b1 =>
                    {
                        b1.Property<Guid>("LoanApplicationEntityId")
                            .HasColumnType("uuid");

                        b1.HasKey("LoanApplicationEntityId");

                        b1.ToTable("LoanApplications");

                        b1.WithOwner()
                            .HasForeignKey("LoanApplicationEntityId");
                    });
            });

        modelBuilder.Entity("LoanHub.Search.Infrastructure.Persistence.Entities.OfferSelectionEntity", b =>
            {
                b.OwnsOne("LoanHub.Search.Infrastructure.Persistence.Entities.OfferSnapshotEntity", "RecalculatedOffer", b1 =>
                    {
                        b1.Property<Guid>("OfferSelectionEntityId")
                            .HasColumnType("uuid");

                        b1.HasKey("OfferSelectionEntityId");

                        b1.ToTable("OfferSelections");

                        b1.WithOwner()
                            .HasForeignKey("OfferSelectionEntityId");
                    });

                b.OwnsOne("LoanHub.Search.Infrastructure.Persistence.Entities.OfferSnapshotEntity", "SelectedOffer", b1 =>
                    {
                        b1.Property<Guid>("OfferSelectionEntityId")
                            .HasColumnType("uuid");

                        b1.HasKey("OfferSelectionEntityId");

                        b1.ToTable("OfferSelections");

                        b1.WithOwner()
                            .HasForeignKey("OfferSelectionEntityId");
                    });
            });
    }
}
