-- CreateTable
CREATE TABLE "first_teams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "location_city" TEXT NOT NULL,
    "location_state_province" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "location_county" TEXT NOT NULL,
    "league_code" TEXT NOT NULL,
    "league_name" TEXT NOT NULL,
    "league_remote" BOOLEAN NOT NULL,
    "league_location" TEXT NOT NULL,
    "rookie_year" INTEGER NOT NULL,
    "website" TEXT,
    "saved_at" DATETIME NOT NULL
);
