/*
  Warnings:

  - Added the required column `hash` to the `first_event` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_first_event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hash" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "website" TEXT,
    "date_start" DATETIME NOT NULL,
    "date_end" DATETIME NOT NULL,
    "live_stream_url" TEXT,
    "location_name" TEXT NOT NULL,
    "location_address" TEXT NOT NULL,
    "location_city" TEXT NOT NULL,
    "location_state_province" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "location_zip" TEXT,
    "location_timezone" TEXT NOT NULL,
    "location_website" TEXT,
    "open" BOOLEAN NOT NULL,
    "opens_at" DATETIME,
    "closes_at" DATETIME,
    "deadline" DATETIME,
    "url" TEXT,
    "saved_at" DATETIME NOT NULL
);
INSERT INTO "new_first_event" ("closes_at", "code", "date_end", "date_start", "deadline", "format", "id", "live_stream_url", "location_address", "location_city", "location_country", "location_name", "location_state_province", "location_timezone", "location_website", "location_zip", "name", "open", "opens_at", "saved_at", "season", "type", "url", "website") SELECT "closes_at", "code", "date_end", "date_start", "deadline", "format", "id", "live_stream_url", "location_address", "location_city", "location_country", "location_name", "location_state_province", "location_timezone", "location_website", "location_zip", "name", "open", "opens_at", "saved_at", "season", "type", "url", "website" FROM "first_event";
DROP TABLE "first_event";
ALTER TABLE "new_first_event" RENAME TO "first_event";
CREATE UNIQUE INDEX "first_event_hash_key" ON "first_event"("hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
