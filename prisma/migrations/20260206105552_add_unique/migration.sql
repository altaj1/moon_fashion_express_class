/*
  Warnings:

  - A unique constraint covering the columns `[invoiceId]` on the table `invoice_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_invoiceId_key" ON "invoice_items"("invoiceId");
