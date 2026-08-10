using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVacationUserRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EmployeeUserId",
                table: "LeaveRequests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ReviewedAtUtc",
                table: "LeaveRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "LeaveRequests",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_EmployeeUserId",
                table: "LeaveRequests",
                column: "EmployeeUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_ReviewedByUserId",
                table: "LeaveRequests",
                column: "ReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_ApplicationUsers_EmployeeUserId",
                table: "LeaveRequests",
                column: "EmployeeUserId",
                principalTable: "ApplicationUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_ApplicationUsers_ReviewedByUserId",
                table: "LeaveRequests",
                column: "ReviewedByUserId",
                principalTable: "ApplicationUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_ApplicationUsers_EmployeeUserId",
                table: "LeaveRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_ApplicationUsers_ReviewedByUserId",
                table: "LeaveRequests");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_EmployeeUserId",
                table: "LeaveRequests");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_ReviewedByUserId",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "EmployeeUserId",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "ReviewedAtUtc",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "LeaveRequests");
        }
    }
}
