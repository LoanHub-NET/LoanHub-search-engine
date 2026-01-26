using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoanHub.Search.Infrastructure.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                PasswordHash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                Role = table.Column<int>(type: "integer", nullable: false),
                FirstName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                LastName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                Age = table.Column<int>(type: "integer", nullable: true),
                JobTitle = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                Address = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                IdDocumentNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "LoanApplications",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: true),
                ApplicantEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Status = table.Column<int>(type: "integer", nullable: false),
                RejectReason = table.Column<string>(type: "text", nullable: true),
                ContractReadyAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                SignedContractFileName = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                SignedContractBlobName = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                SignedContractContentType = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                SignedContractReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                FinalApprovedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ApplicantFirstName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                ApplicantLastName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                ApplicantAge = table.Column<int>(type: "integer", nullable: false),
                ApplicantJobTitle = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                ApplicantAddress = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                ApplicantIdDocumentNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                OfferProvider = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                OfferProviderOfferId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                OfferInstallment = table.Column<decimal>(type: "numeric", nullable: false),
                OfferApr = table.Column<decimal>(type: "numeric", nullable: false),
                OfferTotalCost = table.Column<decimal>(type: "numeric", nullable: false),
                OfferAmount = table.Column<decimal>(type: "numeric", nullable: false),
                OfferDurationMonths = table.Column<int>(type: "integer", nullable: false),
                OfferValidUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LoanApplications", x => x.Id);
                table.ForeignKey(
                    name: "FK_LoanApplications_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "ExternalIdentities",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                Provider = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ExternalIdentities", x => x.Id);
                table.ForeignKey(
                    name: "FK_ExternalIdentities_Users_UserAccountId",
                    column: x => x.UserAccountId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "OfferSelections",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                InquiryId = table.Column<Guid>(type: "uuid", nullable: false),
                Income = table.Column<decimal>(type: "numeric", nullable: true),
                LivingCosts = table.Column<decimal>(type: "numeric", nullable: true),
                Dependents = table.Column<int>(type: "integer", nullable: true),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: true),
                AppliedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                SelectedOfferProvider = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                SelectedOfferProviderOfferId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                SelectedOfferInstallment = table.Column<decimal>(type: "numeric", nullable: false),
                SelectedOfferApr = table.Column<decimal>(type: "numeric", nullable: false),
                SelectedOfferTotalCost = table.Column<decimal>(type: "numeric", nullable: false),
                SelectedOfferAmount = table.Column<decimal>(type: "numeric", nullable: false),
                SelectedOfferDurationMonths = table.Column<int>(type: "integer", nullable: false),
                SelectedOfferValidUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                RecalculatedOfferProvider = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                RecalculatedOfferProviderOfferId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                RecalculatedOfferInstallment = table.Column<decimal>(type: "numeric", nullable: true),
                RecalculatedOfferApr = table.Column<decimal>(type: "numeric", nullable: true),
                RecalculatedOfferTotalCost = table.Column<decimal>(type: "numeric", nullable: true),
                RecalculatedOfferAmount = table.Column<decimal>(type: "numeric", nullable: true),
                RecalculatedOfferDurationMonths = table.Column<int>(type: "integer", nullable: true),
                RecalculatedOfferValidUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OfferSelections", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "ApplicationStatusHistory",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                LoanApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                Status = table.Column<int>(type: "integer", nullable: false),
                ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Reason = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ApplicationStatusHistory", x => x.Id);
                table.ForeignKey(
                    name: "FK_ApplicationStatusHistory_LoanApplications_LoanApplicationId",
                    column: x => x.LoanApplicationId,
                    principalTable: "LoanApplications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_ApplicationStatusHistory_LoanApplicationId",
            table: "ApplicationStatusHistory",
            column: "LoanApplicationId");

        migrationBuilder.CreateIndex(
            name: "IX_ExternalIdentities_Provider_Subject",
            table: "ExternalIdentities",
            columns: new[] { "Provider", "Subject" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_ExternalIdentities_UserAccountId",
            table: "ExternalIdentities",
            column: "UserAccountId");

        migrationBuilder.CreateIndex(
            name: "IX_LoanApplications_ApplicantEmail",
            table: "LoanApplications",
            column: "ApplicantEmail");

        migrationBuilder.CreateIndex(
            name: "IX_LoanApplications_UserId",
            table: "LoanApplications",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_OfferSelections_ApplicationId",
            table: "OfferSelections",
            column: "ApplicationId");

        migrationBuilder.CreateIndex(
            name: "IX_OfferSelections_InquiryId",
            table: "OfferSelections",
            column: "InquiryId");

        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            table: "Users",
            column: "Email",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ApplicationStatusHistory");
        migrationBuilder.DropTable(name: "ExternalIdentities");
        migrationBuilder.DropTable(name: "OfferSelections");
        migrationBuilder.DropTable(name: "LoanApplications");
        migrationBuilder.DropTable(name: "Users");
    }
}
