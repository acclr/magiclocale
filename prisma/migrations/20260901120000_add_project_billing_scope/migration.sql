-- CreateEnum
CREATE TYPE "BillingScope" AS ENUM ('TEAM', 'PROJECT');

-- AlterTable
ALTER TABLE "TranslationProject" ADD COLUMN "billingScope" "BillingScope" NOT NULL DEFAULT 'TEAM',
ADD COLUMN "billingId" TEXT,
ADD COLUMN "billingProvider" TEXT;

-- CreateIndex
CREATE INDEX "TranslationProject_billingId_idx" ON "TranslationProject"("billingId");
