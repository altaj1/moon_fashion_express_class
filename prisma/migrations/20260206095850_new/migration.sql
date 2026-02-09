-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- CreateEnum
CREATE TYPE "OTPType" AS ENUM ('email_verification', 'login_verification', 'password_reset', 'two_factor');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('FABRIC', 'LABEL_TAG', 'CARTON');

-- CreateEnum
CREATE TYPE "PIStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "UserAccountStatus" NOT NULL DEFAULT 'active',
    "password" TEXT NOT NULL,
    "isPasswordChanged" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTP" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "type" "OTPType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "merchandiser" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "piNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "buyerId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "PIStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceItemId" UUID NOT NULL,
    "invoiceTermsId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fabricId" UUID,
    "labelId" UUID,
    "cartonId" UUID,
    "invoiceId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "label_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "styleNo" TEXT NOT NULL,
    "netWeightTotal" DECIMAL(65,30),
    "grossWeightTotal" DECIMAL(65,30),
    "quantityDznTotal" DECIMAL(65,30),
    "quantityPcsTotal" DECIMAL(65,30),
    "unitPriceTotal" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "label_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "label_item_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "desscription" TEXT,
    "color" TEXT,
    "netWeight" DECIMAL(65,30),
    "grossWeight" DECIMAL(65,30),
    "quantityDzn" DECIMAL(65,30),
    "quantityPcs" DECIMAL(65,30),
    "unitPrice" DECIMAL(65,30),
    "TotalAmount" DECIMAL(65,30),
    "labelItemId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "label_item_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "styleNo" TEXT NOT NULL,
    "discription" TEXT,
    "width" TEXT,
    "totalNetWeight" DECIMAL(65,30),
    "totalGrossWeight" DECIMAL(65,30),
    "totalQuantityYds" DECIMAL(65,30),
    "totalUnitPrice" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fabric_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_item_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "color" TEXT,
    "netWeight" DECIMAL(65,30),
    "grossWeight" DECIMAL(65,30),
    "quantityYds" DECIMAL(65,30),
    "unitPrice" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30),
    "fabricItemId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fabric_item_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carton_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNo" TEXT NOT NULL,
    "totalcartonQty" INTEGER,
    "totalNetWeight" DECIMAL(65,30),
    "totalGrossWeight" DECIMAL(65,30),
    "totalUnitPrice" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carton_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carton_item_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cartonMeasurement" TEXT,
    "cartonPly" TEXT,
    "cartonQty" INTEGER,
    "netWeight" DECIMAL(65,30),
    "grossWeight" DECIMAL(65,30),
    "unit" TEXT,
    "unitPrice" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30),
    "cartonItemId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carton_item_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_terms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT 'Default Terms',
    "payment" TEXT,
    "delivery" TEXT,
    "advisingBank" TEXT,
    "negotiation" TEXT,
    "origin" TEXT,
    "swiftCode" TEXT,
    "binNo" TEXT,
    "hsCode" TEXT,
    "remarks" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "OTP_identifier_type_verified_idx" ON "OTP"("identifier", "type", "verified");

-- CreateIndex
CREATE INDEX "OTP_expiresAt_idx" ON "OTP"("expiresAt");

-- CreateIndex
CREATE INDEX "OTP_userId_idx" ON "OTP"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_email_key" ON "Buyer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_piNumber_key" ON "invoices"("piNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceItemId_key" ON "invoices"("invoiceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_fabricId_key" ON "invoice_items"("fabricId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_labelId_key" ON "invoice_items"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_cartonId_key" ON "invoice_items"("cartonId");

-- AddForeignKey
ALTER TABLE "OTP" ADD CONSTRAINT "OTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "invoice_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoiceTermsId_fkey" FOREIGN KEY ("invoiceTermsId") REFERENCES "invoice_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "fabric_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_cartonId_fkey" FOREIGN KEY ("cartonId") REFERENCES "carton_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_item_data" ADD CONSTRAINT "label_item_data_labelItemId_fkey" FOREIGN KEY ("labelItemId") REFERENCES "label_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_item_data" ADD CONSTRAINT "fabric_item_data_fabricItemId_fkey" FOREIGN KEY ("fabricItemId") REFERENCES "fabric_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carton_item_data" ADD CONSTRAINT "carton_item_data_cartonItemId_fkey" FOREIGN KEY ("cartonItemId") REFERENCES "carton_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
