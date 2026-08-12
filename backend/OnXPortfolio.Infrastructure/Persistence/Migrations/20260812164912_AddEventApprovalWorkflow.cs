using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEventApprovalWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "Events",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

                migrationBuilder.Sql(
    """
    UPDATE "Events"
    SET "ApprovalStatus" = 'Approved';
    """);

            migrationBuilder.AddColumn<string>(
                name: "ReviewNotes",
                table: "Events",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ReviewedAtUtc",
                table: "Events",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "Events",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SubmittedByUserId",
                table: "Events",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_ApprovalStatus",
                table: "Events",
                column: "ApprovalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Events_ReviewedByUserId",
                table: "Events",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SubmittedByUserId",
                table: "Events",
                column: "SubmittedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_ApplicationUsers_ReviewedByUserId",
                table: "Events",
                column: "ReviewedByUserId",
                principalTable: "ApplicationUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Events_ApplicationUsers_SubmittedByUserId",
                table: "Events",
                column: "SubmittedByUserId",
                principalTable: "ApplicationUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_ApplicationUsers_ReviewedByUserId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_Events_ApplicationUsers_SubmittedByUserId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_ApprovalStatus",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_ReviewedByUserId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_SubmittedByUserId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ReviewNotes",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ReviewedAtUtc",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "SubmittedByUserId",
                table: "Events");
        }
    }
}
