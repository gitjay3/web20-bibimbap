-- CreateIndex
CREATE INDEX "CamperOrganization_organizationId_groupNumber_idx" ON "CamperOrganization"("organizationId", "groupNumber");

-- CreateIndex
CREATE INDEX "CamperPreRegistration_organizationId_status_idx" ON "CamperPreRegistration"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Reservation_userId_status_idx" ON "Reservation"("userId", "status");

-- CreateIndex
CREATE INDEX "Reservation_userId_slotId_status_idx" ON "Reservation"("userId", "slotId", "status");
