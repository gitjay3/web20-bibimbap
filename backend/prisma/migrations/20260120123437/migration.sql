/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,camperId]` on the table `CamperPreRegistration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CamperPreRegistration_organizationId_camperId_key" ON "CamperPreRegistration"("organizationId", "camperId");
