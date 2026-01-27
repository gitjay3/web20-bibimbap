-- CreateTable
CREATE TABLE "EventNotification" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "eventId" INTEGER NOT NULL,
    "scheduledMessageId" TEXT,
    "notificationTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventNotification_userId_eventId_key" ON "EventNotification"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "EventNotification" ADD CONSTRAINT "EventNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNotification" ADD CONSTRAINT "EventNotification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
