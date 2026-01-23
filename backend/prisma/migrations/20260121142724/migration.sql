/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,camperId]` on the table `CamperOrganization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `CamperOrganization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CamperOrganization" ADD COLUMN     "camperId" TEXT,
ADD COLUMN     "groupNumber" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CamperOrganization_organizationId_camperId_key" ON "CamperOrganization"("organizationId", "camperId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
