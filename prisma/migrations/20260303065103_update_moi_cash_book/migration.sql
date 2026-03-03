-- AlterTable
ALTER TABLE "employee_advances" ADD COLUMN     "advanceAccountId" UUID,
ADD COLUMN     "cashAccountId" UUID,
ADD COLUMN     "expenseAccountId" UUID;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "account_heads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_advanceAccountId_fkey" FOREIGN KEY ("advanceAccountId") REFERENCES "account_heads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "account_heads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
