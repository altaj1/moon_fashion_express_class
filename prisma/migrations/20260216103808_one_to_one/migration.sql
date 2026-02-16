/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceId]` on the table `lc_managements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `lc_managements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoiceId" UUID,
ADD COLUMN     "isInvoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lcId" UUID;

-- AlterTable
ALTER TABLE "carton_items" ADD COLUMN     "totalAmount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "lc_managements" ADD COLUMN     "userId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_orderId_key" ON "invoices"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "lc_managements_invoiceId_key" ON "lc_managements"("invoiceId");

-- AddForeignKey
ALTER TABLE "lc_managements" ADD CONSTRAINT "lc_managements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
