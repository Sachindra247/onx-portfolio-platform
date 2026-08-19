using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificationPeopleDirectory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CertificationPersonId",
                table: "Certifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CertificationPeople",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    ApplicationUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ManagerPersonId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificationPeople", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificationPeople_ApplicationUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CertificationPeople_CertificationPeople_ManagerPersonId",
                        column: x => x.ManagerPersonId,
                        principalTable: "CertificationPeople",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_CertificationPersonId",
                table: "Certifications",
                column: "CertificationPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationPeople_ApplicationUserId",
                table: "CertificationPeople",
                column: "ApplicationUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CertificationPeople_Email",
                table: "CertificationPeople",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationPeople_ManagerPersonId",
                table: "CertificationPeople",
                column: "ManagerPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationPeople_Name",
                table: "CertificationPeople",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_Certifications_CertificationPeople_CertificationPersonId",
                table: "Certifications",
                column: "CertificationPersonId",
                principalTable: "CertificationPeople",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Certifications_CertificationPeople_CertificationPersonId",
                table: "Certifications");

            migrationBuilder.DropTable(
                name: "CertificationPeople");

            migrationBuilder.DropIndex(
                name: "IX_Certifications_CertificationPersonId",
                table: "Certifications");

            migrationBuilder.DropColumn(
                name: "CertificationPersonId",
                table: "Certifications");
        }
    }
}
