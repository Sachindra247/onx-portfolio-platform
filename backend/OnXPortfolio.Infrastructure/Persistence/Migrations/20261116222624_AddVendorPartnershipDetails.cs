using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorPartnershipDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PartnerPrograms",
                table: "Vendors",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartnershipBenefits",
                table: "Vendors",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartnershipStatus",
                table: "Vendors",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartnershipTier",
                table: "Vendors",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PrimaryPartnerManagerId",
                table: "Vendors",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vendors_PrimaryPartnerManagerId",
                table: "Vendors",
                column: "PrimaryPartnerManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Vendors_ApplicationUsers_PrimaryPartnerManagerId",
                table: "Vendors",
                column: "PrimaryPartnerManagerId",
                principalTable: "ApplicationUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vendors_ApplicationUsers_PrimaryPartnerManagerId",
                table: "Vendors");

            migrationBuilder.DropIndex(
                name: "IX_Vendors_PrimaryPartnerManagerId",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "PartnerPrograms",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "PartnershipBenefits",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "PartnershipStatus",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "PartnershipTier",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "PrimaryPartnerManagerId",
                table: "Vendors");
        }
    }
}
