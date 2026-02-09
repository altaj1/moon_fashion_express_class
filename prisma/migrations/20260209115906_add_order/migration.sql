/*
  Warnings:

  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `bankName` on the `lc_managements` table. All the data in the column will be lost.
  - You are about to drop the column `lcNumber` on the `lc_managements` table. All the data in the column will be lost.
  - Added the required column `companyProfileId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bblcNumber` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfOpening` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lcIssueBankBranch` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lcIssueBankName` to the `lc_managements` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FABRIC', 'LABEL_TAG', 'CARTON');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'PROCESSING', 'APPROVED', 'DELIVERED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_cartonId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_fabricId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_labelId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_buyerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status",
ADD COLUMN     "status" "UserAccountStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "companyProfileId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "lc_managements" DROP COLUMN "bankName",
DROP COLUMN "lcNumber",
ADD COLUMN     "bblcNumber" TEXT NOT NULL,
ADD COLUMN     "dateOfOpening" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "lcIssueBankBranch" TEXT NOT NULL,
ADD COLUMN     "lcIssueBankName" TEXT NOT NULL,
ADD COLUMN     "notifyParty" TEXT;

-- DropEnum
DROP TYPE "UserUserAccountStatus";

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNumber" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3),
    "remarks" TEXT,
    "productType" "ProductType" NOT NULL,
    "buyerId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyProfileId" UUID NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "deletedAt" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fabricId" UUID,
    "labelId" UUID,
    "cartonId" UUID,
    "orderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "fabric_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_cartonId_fkey" FOREIGN KEY ("cartonId") REFERENCES "carton_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
