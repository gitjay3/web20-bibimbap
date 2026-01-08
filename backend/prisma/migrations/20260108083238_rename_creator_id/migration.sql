/*
  Warnings:

  - You are about to drop the column `creatorUserId` on the `Event` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_creatorUserId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "creatorUserId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
