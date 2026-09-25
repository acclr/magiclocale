-- AlterTable
ALTER TABLE "TranslationProject" ADD COLUMN "allowedOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[];
