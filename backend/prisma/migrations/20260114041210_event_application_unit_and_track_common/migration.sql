/*
  Warnings:

  - The values [ALL] on the enum `Track` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `accessToken` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApplicationUnit" AS ENUM ('INDIVIDUAL', 'TEAM');

-- AlterEnum
BEGIN;
CREATE TYPE "Track_new" AS ENUM ('ANDROID', 'IOS', 'WEB', 'COMMON');
ALTER TABLE "public"."Event" ALTER COLUMN "track" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "track" TYPE "Track_new" USING ("track"::text::"Track_new");
ALTER TYPE "Track" RENAME TO "Track_old";
ALTER TYPE "Track_new" RENAME TO "Track";
DROP TYPE "public"."Track_old";
ALTER TABLE "Event" ALTER COLUMN "track" SET DEFAULT 'COMMON';
COMMIT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "applicationUnit" "ApplicationUnit" NOT NULL DEFAULT 'INDIVIDUAL',
ALTER COLUMN "track" SET DEFAULT 'COMMON';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accessToken";
