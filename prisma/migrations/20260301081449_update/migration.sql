/*
  Warnings:

  - Added the required column `companyProfileId` to the `employee_advances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employee_advances" ADD COLUMN     "companyProfileId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
