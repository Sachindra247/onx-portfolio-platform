using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEventCalendarScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
{
    var isPostgres = migrationBuilder.ActiveProvider ==
        "Npgsql.EntityFrameworkCore.PostgreSQL";

    migrationBuilder.AddColumn<TimeOnly>(
        name: "EndTime",
        table: "Events",
        type: isPostgres ? "time without time zone" : "TEXT",
        nullable: true);

    migrationBuilder.AddColumn<TimeOnly>(
        name: "StartTime",
        table: "Events",
        type: isPostgres ? "time without time zone" : "TEXT",
        nullable: true);

    migrationBuilder.AddColumn<string>(
        name: "TimeZoneId",
        table: "Events",
        type: isPostgres ? "character varying(100)" : "TEXT",
        maxLength: 100,
        nullable: true);
}

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropColumn(
        name: "EndTime",
        table: "Events");

    migrationBuilder.DropColumn(
        name: "StartTime",
        table: "Events");

    migrationBuilder.DropColumn(
        name: "TimeZoneId",
        table: "Events");
}
    }
}
