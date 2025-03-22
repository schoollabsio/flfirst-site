/*
  Warnings:

  - You are about to alter the column `number` on the `first_teams` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- CreateTable
CREATE TABLE "first_videos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_code" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "team" INTEGER NOT NULL,
    "award" TEXT NOT NULL,
    "url" TEXT,
    "available_at" DATETIME NOT NULL,
    "saved_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_first_teams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
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
INSERT INTO "new_first_teams" ("event_ready", "id", "league_code", "league_location", "league_name", "league_remote", "location_city", "location_country", "location_county", "location_state_province", "name", "number", "rookie_year", "saved_at", "url", "website") SELECT "event_ready", "id", "league_code", "league_location", "league_name", "league_remote", "location_city", "location_country", "location_county", "location_state_province", "name", "number", "rookie_year", "saved_at", "url", "website" FROM "first_teams";
DROP TABLE "first_teams";
ALTER TABLE "new_first_teams" RENAME TO "first_teams";
CREATE UNIQUE INDEX "first_teams_number_key" ON "first_teams"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
