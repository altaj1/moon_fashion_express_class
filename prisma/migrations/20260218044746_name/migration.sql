/*
  Warnings:

  - The values [finance,account,order] on the enum `Module` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'GENERAL');

-- AlterEnum
BEGIN;
CREATE TYPE "Module_new" AS ENUM ('dashboard', 'companyProfile', 'users', 'buyer', 'invoiceTerms', 'orders', 'piManagement', 'lcManagement');
ALTER TABLE "User" ALTER COLUMN "modules" TYPE "Module_new"[] USING ("modules"::text::"Module_new"[]);
ALTER TYPE "Module" RENAME TO "Module_old";
ALTER TYPE "Module_new" RENAME TO "Module";
DROP TYPE "public"."Module_old";
COMMIT;
