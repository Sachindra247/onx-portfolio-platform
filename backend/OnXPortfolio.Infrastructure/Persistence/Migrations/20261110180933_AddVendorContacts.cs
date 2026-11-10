
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    public partial class AddVendorContacts : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isPostgres = migrationBuilder.ActiveProvider ==
                "Npgsql.EntityFrameworkCore.PostgreSQL";

            migrationBuilder.CreateTable(
                name: "VendorContacts",
                columns: table => new
                {
                    Id = table.Column<Guid>(
                        type: isPostgres ? "uuid" : "TEXT",
                        nullable: false),

                    VendorId = table.Column<Guid>(
                        type: isPostgres ? "uuid" : "TEXT",
                        nullable: false),

                    Name = table.Column<string>(
                        type: isPostgres ? "character varying(200)" : "TEXT",
                        maxLength: 200,
                        nullable: false),

                    JobTitle = table.Column<string>(
                        type: isPostgres ? "character varying(150)" : "TEXT",
                        maxLength: 150,
                        nullable: true),

                    Email = table.Column<string>(
                        type: isPostgres ? "character varying(254)" : "TEXT",
                        maxLength: 254,
                        nullable: true),

                    Phone = table.Column<string>(
                        type: isPostgres ? "character varying(50)" : "TEXT",
                        maxLength: 50,
                        nullable: true),

                    CreatedAtUtc = table.Column<DateTimeOffset>(
                        type: isPostgres ? "timestamp with time zone" : "TEXT",
                        nullable: false),

                    UpdatedAtUtc = table.Column<DateTimeOffset>(
                        type: isPostgres ? "timestamp with time zone" : "TEXT",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorContacts", x => x.Id);

                    table.ForeignKey(
                        name: "FK_VendorContacts_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorContacts_VendorId",
                table: "VendorContacts",
                column: "VendorId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VendorContacts");
        }
    }
}
