/*
  Warnings:

  - Added the required column `event_ready` to the `first_teams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `first_teams` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_first_teams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "location_city" TEXT NOT NULL,
    "location_state_province" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "location_county" TEXT,
    "league_code" TEXT,
    "league_name" TEXT,
    "league_remote" BOOLEAN,
    "league_location" TEXT,
    "rookie_year" TEXT NOT NULL,
    "website" TEXT,
    "url" TEXT NOT NULL,
    "event_ready" BOOLEAN NOT NULL,
    "saved_at" DATETIME NOT NULL
);
INSERT INTO "new_first_teams" ("id", "league_code", "league_location", "league_name", "league_remote", "location_city", "location_country", "location_county", "location_state_province", "name", "number", "rookie_year", "saved_at", "website") SELECT "id", "league_code", "league_location", "league_name", "league_remote", "location_city", "location_country", "location_county", "location_state_province", "name", "number", "rookie_year", "saved_at", "website" FROM "first_teams";
DROP TABLE "first_teams";
ALTER TABLE "new_first_teams" RENAME TO "first_teams";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
