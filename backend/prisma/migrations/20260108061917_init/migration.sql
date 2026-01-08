-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "slotSchema" JSONB NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSlot" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "extraInfo" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSlot_eventId_idx" ON "EventSlot"("eventId");

-- AddForeignKey
ALTER TABLE "EventSlot" ADD CONSTRAINT "EventSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
