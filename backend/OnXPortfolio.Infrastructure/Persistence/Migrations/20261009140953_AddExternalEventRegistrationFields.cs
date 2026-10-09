using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalEventRegistrationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isPostgres = migrationBuilder.ActiveProvider ==
                "Npgsql.EntityFrameworkCore.PostgreSQL";

            migrationBuilder.AddColumn<string>(
                name: "ExternalOrganization",
                table: "EventRegistrations",
                type: isPostgres ? "character varying(200)" : "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalTitle",
                table: "EventRegistrations",
                type: isPostgres ? "character varying(100)" : "TEXT",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExternalOrganization",
                table: "EventRegistrations");

            migrationBuilder.DropColumn(
                name: "ExternalTitle",
                table: "EventRegistrations");
        }
    }
}