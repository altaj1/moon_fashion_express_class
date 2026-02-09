/*
  Warnings:

  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `invoiceItemId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `TotalAmount` on the `label_item_data` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserUserAccountStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- CreateEnum
CREATE TYPE "CompanyUserAccountStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PARENT', 'SISTER');

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_invoiceItemId_fkey";

-- DropIndex
DROP INDEX "invoice_items_cartonId_key";

-- DropIndex
DROP INDEX "invoice_items_fabricId_key";

-- DropIndex
DROP INDEX "invoice_items_invoiceId_key";

-- DropIndex
DROP INDEX "invoice_items_labelId_key";

-- DropIndex
DROP INDEX "invoices_invoiceItemId_key";

-- DropIndex
DROP INDEX "invoices_piNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status",
ADD COLUMN     "status" "UserUserAccountStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "invoiceItemId";

-- AlterTable
ALTER TABLE "label_item_data" DROP COLUMN "TotalAmount",
ADD COLUMN     "totalAmount" DECIMAL(65,30);

-- DropEnum
DROP TYPE "UserAccountStatus";

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "city" TEXT,
    "country" TEXT,
    "companyType" "CompanyType" NOT NULL DEFAULT 'PARENT',
    "postalCode" TEXT,
    "taxId" TEXT,
    "registrationNumber" TEXT,
    "tradeLicenseNumber" TEXT,
    "tradeLicenseExpiryDate" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyUserAccountStatus" NOT NULL DEFAULT 'active',
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "branchName" TEXT,
    "swiftCode" TEXT,
    "routingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_managements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lcNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "buyerId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lc_managements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_managements" ADD CONSTRAINT "lc_managements_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_managements" ADD CONSTRAINT "lc_managements_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
