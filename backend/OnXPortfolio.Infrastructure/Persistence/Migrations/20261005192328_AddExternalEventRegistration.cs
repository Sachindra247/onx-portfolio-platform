using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalEventRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicRegistrationToken",
                table: "Events",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "EventRegistrations",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "ExternalName",
                table: "EventRegistrations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalEmail",
                table: "EventRegistrations",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_PublicRegistrationToken",
                table: "Events",
                column: "PublicRegistrationToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """DELETE FROM "EventRegistrations" WHERE "UserId" IS NULL;""");

            migrationBuilder.DropIndex(
                name: "IX_Events_PublicRegistrationToken",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "PublicRegistrationToken",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ExternalName",
                table: "EventRegistrations");

            migrationBuilder.DropColumn(
                name: "ExternalEmail",
                table: "EventRegistrations");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "EventRegistrations",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}