/*
  Warnings:

  - You are about to drop the column `buyerId` on the `lc_managements` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "lc_managements" DROP CONSTRAINT "lc_managements_buyerId_fkey";

-- AlterTable
ALTER TABLE "lc_managements" DROP COLUMN "buyerId";
