using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificationReminderLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CertificationReminderLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CertificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    ReminderDays = table.Column<int>(type: "integer", nullable: false),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    SentAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificationReminderLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificationReminderLogs_Certifications_CertificationId",
                        column: x => x.CertificationId,
                        principalTable: "Certifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CertificationReminderLogs_CertificationId",
                table: "CertificationReminderLogs",
                column: "CertificationId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationReminderLogs_CertificationId_ExpiryDate_Remind~",
                table: "CertificationReminderLogs",
                columns: new[] { "CertificationId", "ExpiryDate", "ReminderDays" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CertificationReminderLogs_SentAtUtc",
                table: "CertificationReminderLogs",
                column: "SentAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationReminderLogs_Status",
                table: "CertificationReminderLogs",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CertificationReminderLogs");
        }
    }
}
