/*
  Warnings:

  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Event";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "FirstEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "deadline" DATETIME,
    "url" TEXT
);
