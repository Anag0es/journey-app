-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destination" TEXT NOT NULL,
    "starts_At" DATETIME NOT NULL,
    "ends_At" DATETIME NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Trip" ("destination", "ends_At", "id", "starts_At") SELECT "destination", "ends_At", "id", "starts_At" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
