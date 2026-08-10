using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationUsersAndGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApplicationGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApplicationUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CertificationsAccess = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    EventsAccess = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    VacationAccess = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    IsGlobalAdministrator = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    LoginEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManagerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApplicationUsers_ApplicationGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "ApplicationGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApplicationUsers_ApplicationUsers_ManagerId",
                        column: x => x.ManagerId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationGroups_Name",
                table: "ApplicationGroups",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUsers_Email",
                table: "ApplicationUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUsers_GroupId",
                table: "ApplicationUsers",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationUsers_ManagerId",
                table: "ApplicationUsers",
                column: "ManagerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApplicationUsers");

            migrationBuilder.DropTable(
                name: "ApplicationGroups");
        }
    }
}
