-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destination" TEXT NOT NULL,
    "starts_At" DATETIME NOT NULL,
    "ends_At" DATETIME NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_At" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "trips_destination_key" ON "trips"("destination");
