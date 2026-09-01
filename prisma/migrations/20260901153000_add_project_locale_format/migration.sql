-- CreateEnum
CREATE TYPE "LocaleFormat" AS ENUM ('LANGUAGE', 'REGIONAL');

-- AlterTable
ALTER TABLE "TranslationProject" ADD COLUMN "localeFormat" "LocaleFormat" NOT NULL DEFAULT 'LANGUAGE';

-- Backfill projects that already use regional tags
UPDATE "TranslationProject"
SET "localeFormat" = 'REGIONAL'
WHERE "sourceLocale" LIKE '%-%';
