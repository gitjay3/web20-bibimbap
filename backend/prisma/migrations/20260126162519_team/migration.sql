-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "groupNumber" INTEGER;

-- CreateIndex
CREATE INDEX "Reservation_slotId_groupNumber_idx" ON "Reservation"("slotId", "groupNumber");
