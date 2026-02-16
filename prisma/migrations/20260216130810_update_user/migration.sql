/*
  Warnings:

  - Added the required column `designation` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Module" AS ENUM ('finance', 'account', 'order', 'buyer', 'lcManagement');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "designation" TEXT NOT NULL,
ADD COLUMN     "modules" "Module"[];
