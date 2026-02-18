/*
  Warnings:

  - The values [buyer] on the enum `Module` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `binNo` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carrier` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `challanNo` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactNo` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverName` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exportLcNo` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hsCodeNo` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remarks` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selesTerm` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transportMode` to the `lc_managements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleNo` to the `lc_managements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Module_new" AS ENUM ('dashboard', 'companyProfile', 'users', 'buyers', 'invoiceTerms', 'orders', 'accounts', 'piManagement', 'lcManagement');
ALTER TABLE "User" ALTER COLUMN "modules" TYPE "Module_new"[] USING ("modules"::text::"Module_new"[]);
ALTER TYPE "Module" RENAME TO "Module_old";
ALTER TYPE "Module_new" RENAME TO "Module";
DROP TYPE "public"."Module_old";
COMMIT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "lc_managements" ADD COLUMN     "binNo" TEXT NOT NULL,
ADD COLUMN     "carrier" TEXT NOT NULL,
ADD COLUMN     "challanNo" TEXT NOT NULL,
ADD COLUMN     "contactNo" TEXT NOT NULL,
ADD COLUMN     "driverName" TEXT NOT NULL,
ADD COLUMN     "exportLcNo" TEXT NOT NULL,
ADD COLUMN     "hsCodeNo" TEXT NOT NULL,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remarks" TEXT NOT NULL,
ADD COLUMN     "selesTerm" TEXT NOT NULL,
ADD COLUMN     "transportMode" TEXT NOT NULL,
ADD COLUMN     "vehicleNo" TEXT NOT NULL;
