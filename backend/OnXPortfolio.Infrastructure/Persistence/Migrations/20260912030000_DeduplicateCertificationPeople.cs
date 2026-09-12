using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OnXPortfolio.Infrastructure.Persistence;

#nullable disable

namespace OnXPortfolio.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260912030000_DeduplicateCertificationPeople")]
    public partial class DeduplicateCertificationPeople : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL")
            {
                migrationBuilder.Sql(
                    """
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM "CertificationPeople"
                            WHERE "ApplicationUserId" IS NULL
                            GROUP BY LOWER(BTRIM("Name"))
                            HAVING COUNT(*) > 1
                               AND (
                                   COUNT(DISTINCT COALESCE(LOWER(BTRIM("Email")), '<NULL>')) > 1
                                   OR COUNT(DISTINCT COALESCE("ManagerPersonId"::text, '<NULL>')) > 1
                               )
                        ) THEN
                            RAISE EXCEPTION
                                'CertificationPeople contains exact-name manual duplicates with conflicting email or manager values. Cleanup aborted.';
                        END IF;
                    END
                    $$;

                    CREATE TEMP TABLE "__PersonMergeMap"
                    (
                        "OldId" uuid PRIMARY KEY,
                        "CanonicalId" uuid NOT NULL
                    ) ON COMMIT DROP;

                    WITH ranked AS
                    (
                        SELECT
                            p."Id",
                            FIRST_VALUE(p."Id") OVER (
                                PARTITION BY LOWER(BTRIM(p."Name"))
                                ORDER BY p."Id"::text
                            ) AS "CanonicalId",
                            ROW_NUMBER() OVER (
                                PARTITION BY LOWER(BTRIM(p."Name"))
                                ORDER BY p."Id"::text
                            ) AS rn
                        FROM "CertificationPeople" p
                        INNER JOIN
                        (
                            SELECT LOWER(BTRIM("Name")) AS normalized_name
                            FROM "CertificationPeople"
                            WHERE "ApplicationUserId" IS NULL
                            GROUP BY LOWER(BTRIM("Name"))
                            HAVING COUNT(*) > 1
                               AND COUNT(DISTINCT COALESCE(LOWER(BTRIM("Email")), '<NULL>')) = 1
                               AND COUNT(DISTINCT COALESCE("ManagerPersonId"::text, '<NULL>')) = 1
                        ) safe
                            ON safe.normalized_name = LOWER(BTRIM(p."Name"))
                        WHERE p."ApplicationUserId" IS NULL
                    )
                    INSERT INTO "__PersonMergeMap" ("OldId", "CanonicalId")
                    SELECT "Id", "CanonicalId"
                    FROM ranked
                    WHERE rn > 1;

                    UPDATE "Certifications" c
                    SET "CertificationPersonId" = m."CanonicalId"
                    FROM "__PersonMergeMap" m
                    WHERE c."CertificationPersonId" = m."OldId";

                    UPDATE "CertificationPeople" p
                    SET "ManagerPersonId" = m."CanonicalId"
                    FROM "__PersonMergeMap" m
                    WHERE p."ManagerPersonId" = m."OldId";

                    DELETE FROM "CertificationPeople" p
                    USING "__PersonMergeMap" m
                    WHERE p."Id" = m."OldId";

                    DO $$
                    BEGIN
                        IF (
                            SELECT COUNT(*)
                            FROM "CertificationPeople"
                            WHERE "ApplicationUserId" IS NULL
                              AND LOWER(BTRIM("Name")) IN
                                  ('mathew claridge', 'matt claridge', 'matthew claridge')
                        ) > 1
                        AND (
                            (
                                SELECT COUNT(DISTINCT COALESCE(LOWER(BTRIM("Email")), '<NULL>'))
                                FROM "CertificationPeople"
                                WHERE "ApplicationUserId" IS NULL
                                  AND LOWER(BTRIM("Name")) IN
                                      ('mathew claridge', 'matt claridge', 'matthew claridge')
                            ) > 1
                            OR
                            (
                                SELECT COUNT(DISTINCT COALESCE("ManagerPersonId"::text, '<NULL>'))
                                FROM "CertificationPeople"
                                WHERE "ApplicationUserId" IS NULL
                                  AND LOWER(BTRIM("Name")) IN
                                      ('mathew claridge', 'matt claridge', 'matthew claridge')
                            ) > 1
                        ) THEN
                            RAISE EXCEPTION
                                'Claridge aliases have conflicting email or manager values. Cleanup aborted.';
                        END IF;
                    END
                    $$;

                    CREATE TEMP TABLE "__ClaridgeCanonical"
                    (
                        "CanonicalId" uuid PRIMARY KEY
                    ) ON COMMIT DROP;

                    INSERT INTO "__ClaridgeCanonical" ("CanonicalId")
                    SELECT p."Id"
                    FROM "CertificationPeople" p
                    WHERE p."ApplicationUserId" IS NULL
                      AND LOWER(BTRIM(p."Name")) IN
                          ('mathew claridge', 'matt claridge', 'matthew claridge')
                    ORDER BY
                        CASE LOWER(BTRIM(p."Name"))
                            WHEN 'mathew claridge' THEN 0
                            WHEN 'matt claridge' THEN 1
                            ELSE 2
                        END,
                        p."Id"::text
                    LIMIT 1;

                    CREATE TEMP TABLE "__ClaridgeMergeMap"
                    (
                        "OldId" uuid PRIMARY KEY,
                        "CanonicalId" uuid NOT NULL
                    ) ON COMMIT DROP;

                    INSERT INTO "__ClaridgeMergeMap" ("OldId", "CanonicalId")
                    SELECT p."Id", c."CanonicalId"
                    FROM "CertificationPeople" p
                    CROSS JOIN "__ClaridgeCanonical" c
                    WHERE p."ApplicationUserId" IS NULL
                      AND LOWER(BTRIM(p."Name")) IN
                          ('mathew claridge', 'matt claridge', 'matthew claridge')
                      AND p."Id" <> c."CanonicalId";

                    UPDATE "Certifications" cert
                    SET "CertificationPersonId" = m."CanonicalId"
                    FROM "__ClaridgeMergeMap" m
                    WHERE cert."CertificationPersonId" = m."OldId";

                    UPDATE "CertificationPeople" p
                    SET "ManagerPersonId" = m."CanonicalId"
                    FROM "__ClaridgeMergeMap" m
                    WHERE p."ManagerPersonId" = m."OldId";

                    DELETE FROM "CertificationPeople" p
                    USING "__ClaridgeMergeMap" m
                    WHERE p."Id" = m."OldId";

                    UPDATE "CertificationPeople" p
                    SET "Name" = 'Mathew Claridge'
                    FROM "__ClaridgeCanonical" c
                    WHERE p."Id" = c."CanonicalId";

                    UPDATE "Certifications" cert
                    SET "PersonName" = 'Mathew Claridge'
                    FROM "__ClaridgeCanonical" c
                    WHERE cert."CertificationPersonId" = c."CanonicalId";
                    """);
            }
            else if (ActiveProvider == "Microsoft.EntityFrameworkCore.Sqlite")
            {
                migrationBuilder.Sql(
                    """
                    CREATE TEMP TABLE "__PersonMergeMap"
                    (
                        "OldId" TEXT PRIMARY KEY,
                        "CanonicalId" TEXT NOT NULL
                    );

                    WITH safe_names AS
                    (
                        SELECT LOWER(TRIM("Name")) AS normalized_name
                        FROM "CertificationPeople"
                        WHERE "ApplicationUserId" IS NULL
                        GROUP BY LOWER(TRIM("Name"))
                        HAVING COUNT(*) > 1
                           AND COUNT(DISTINCT COALESCE(LOWER(TRIM("Email")), '<NULL>')) = 1
                           AND COUNT(DISTINCT COALESCE("ManagerPersonId", '<NULL>')) = 1
                    ),
                    ranked AS
                    (
                        SELECT
                            p."Id",
                            FIRST_VALUE(p."Id") OVER (
                                PARTITION BY LOWER(TRIM(p."Name"))
                                ORDER BY p."Id"
                            ) AS "CanonicalId",
                            ROW_NUMBER() OVER (
                                PARTITION BY LOWER(TRIM(p."Name"))
                                ORDER BY p."Id"
                            ) AS rn
                        FROM "CertificationPeople" p
                        INNER JOIN safe_names s
                            ON s.normalized_name = LOWER(TRIM(p."Name"))
                        WHERE p."ApplicationUserId" IS NULL
                    )
                    INSERT INTO "__PersonMergeMap" ("OldId", "CanonicalId")
                    SELECT "Id", "CanonicalId"
                    FROM ranked
                    WHERE rn > 1;

                    UPDATE "Certifications"
                    SET "CertificationPersonId" =
                    (
                        SELECT m."CanonicalId"
                        FROM "__PersonMergeMap" m
                        WHERE m."OldId" = "Certifications"."CertificationPersonId"
                    )
                    WHERE EXISTS
                    (
                        SELECT 1
                        FROM "__PersonMergeMap" m
                        WHERE m."OldId" = "Certifications"."CertificationPersonId"
                    );

                    UPDATE "CertificationPeople"
                    SET "ManagerPersonId" =
                    (
                        SELECT m."CanonicalId"
                        FROM "__PersonMergeMap" m
                        WHERE m."OldId" = "CertificationPeople"."ManagerPersonId"
                    )
                    WHERE EXISTS
                    (
                        SELECT 1
                        FROM "__PersonMergeMap" m
                        WHERE m."OldId" = "CertificationPeople"."ManagerPersonId"
                    );

                    DELETE FROM "CertificationPeople"
                    WHERE "Id" IN (SELECT "OldId" FROM "__PersonMergeMap");

                    DROP TABLE "__PersonMergeMap";

                    CREATE TEMP TABLE "__ClaridgeCanonical"
                    (
                        "CanonicalId" TEXT PRIMARY KEY
                    );

                    INSERT INTO "__ClaridgeCanonical" ("CanonicalId")
                    SELECT p."Id"
                    FROM "CertificationPeople" p
                    WHERE p."ApplicationUserId" IS NULL
                      AND LOWER(TRIM(p."Name")) IN
                          ('mathew claridge', 'matt claridge', 'matthew claridge')
                      AND
                      (
                          SELECT COUNT(DISTINCT COALESCE(LOWER(TRIM(x."Email")), '<NULL>'))
                          FROM "CertificationPeople" x
                          WHERE x."ApplicationUserId" IS NULL
                            AND LOWER(TRIM(x."Name")) IN
                                ('mathew claridge', 'matt claridge', 'matthew claridge')
                      ) <= 1
                      AND
                      (
                          SELECT COUNT(DISTINCT COALESCE(x."ManagerPersonId", '<NULL>'))
                          FROM "CertificationPeople" x
                          WHERE x."ApplicationUserId" IS NULL
                            AND LOWER(TRIM(x."Name")) IN
                                ('mathew claridge', 'matt claridge', 'matthew claridge')
                      ) <= 1
                    ORDER BY
                        CASE LOWER(TRIM(p."Name"))
                            WHEN 'mathew claridge' THEN 0
                            WHEN 'matt claridge' THEN 1
                            ELSE 2
                        END,
                        p."Id"
                    LIMIT 1;

                    CREATE TEMP TABLE "__ClaridgeMergeMap"
                    (
                        "OldId" TEXT PRIMARY KEY,
                        "CanonicalId" TEXT NOT NULL
                    );

                    INSERT INTO "__ClaridgeMergeMap" ("OldId", "CanonicalId")
                    SELECT p."Id", c."CanonicalId"
                    FROM "CertificationPeople" p
                    CROSS JOIN "__ClaridgeCanonical" c
                    WHERE p."ApplicationUserId" IS NULL
                      AND LOWER(TRIM(p."Name")) IN
                          ('mathew claridge', 'matt claridge', 'matthew claridge')
                      AND p."Id" <> c."CanonicalId";

                    UPDATE "Certifications"
                    SET "CertificationPersonId" =
                    (
                        SELECT m."CanonicalId"
                        FROM "__ClaridgeMergeMap" m
                        WHERE m."OldId" = "Certifications"."CertificationPersonId"
                    )
                    WHERE EXISTS
                    (
                        SELECT 1
                        FROM "__ClaridgeMergeMap" m
                        WHERE m."OldId" = "Certifications"."CertificationPersonId"
                    );

                    UPDATE "CertificationPeople"
                    SET "ManagerPersonId" =
                    (
                        SELECT m."CanonicalId"
                        FROM "__ClaridgeMergeMap" m
                        WHERE m."OldId" = "CertificationPeople"."ManagerPersonId"
                    )
                    WHERE EXISTS
                    (
                        SELECT 1
                        FROM "__ClaridgeMergeMap" m
                        WHERE m."OldId" = "CertificationPeople"."ManagerPersonId"
                    );

                    DELETE FROM "CertificationPeople"
                    WHERE "Id" IN (SELECT "OldId" FROM "__ClaridgeMergeMap");

                    UPDATE "CertificationPeople"
                    SET "Name" = 'Mathew Claridge'
                    WHERE "Id" IN (SELECT "CanonicalId" FROM "__ClaridgeCanonical");

                    UPDATE "Certifications"
                    SET "PersonName" = 'Mathew Claridge'
                    WHERE "CertificationPersonId" IN
                          (SELECT "CanonicalId" FROM "__ClaridgeCanonical");

                    DROP TABLE "__ClaridgeMergeMap";
                    DROP TABLE "__ClaridgeCanonical";
                    """);
            }
            else
            {
                throw new System.NotSupportedException(
                    $"Unsupported EF Core provider for certification-person cleanup: {ActiveProvider}");
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally irreversible.
            // Duplicate person rows cannot be reconstructed safely after their
            // certification and manager references have been consolidated.
        }
    }
}
