/*
  Warnings:

  - The `status` column on the `CompanyProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `buyerId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `companyProfileId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the `invoice_items` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[piNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompanyAccountStatus" AS ENUM ('active', 'inactive');

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_companyProfileId_fkey";

-- AlterTable
ALTER TABLE "CompanyProfile" DROP COLUMN "status",
ADD COLUMN     "status" "CompanyAccountStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "buyerId",
DROP COLUMN "companyProfileId",
DROP COLUMN "totalAmount",
DROP COLUMN "type",
ADD COLUMN     "orderId" UUID NOT NULL;

-- DropTable
DROP TABLE "invoice_items";

-- DropEnum
DROP TYPE "CompanyUserAccountStatus";

-- DropEnum
DROP TYPE "InvoiceType";

-- CreateIndex
CREATE UNIQUE INDEX "invoices_piNumber_key" ON "invoices"("piNumber");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
