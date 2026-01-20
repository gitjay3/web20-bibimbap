/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Template` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_creatorId_fkey";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "creatorId";
