-- CreateEnum
CREATE TYPE "Track" AS ENUM ('ANDROID', 'IOS', 'WEB', 'ALL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "track" "Track" NOT NULL DEFAULT 'ALL';
