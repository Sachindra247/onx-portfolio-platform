using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStructuredVendorBenefits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DealRegistrationAvailable",
                table: "Vendors",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DealRegistrationConditions",
                table: "Vendors",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercentage",
                table: "Vendors",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RebatePercentage",
                table: "Vendors",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SpiffAvailable",
                table: "Vendors",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DealRegistrationAvailable",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "DealRegistrationConditions",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "DiscountPercentage",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "RebatePercentage",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "SpiffAvailable",
                table: "Vendors");
        }
    }
}
