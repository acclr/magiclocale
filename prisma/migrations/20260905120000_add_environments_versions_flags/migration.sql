-- Adds project-scoped environments shared by translations and feature flags,
-- an immutable draft/publish version pipeline per environment, and the
-- feature flag catalog with per-environment configuration and targeting.
--
-- Written by hand rather than generated, because making Translation
-- environment-scoped requires backfilling the new column and swapping the
-- unique index without dropping existing translation rows.

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "VersionChangeEntityType" AS ENUM ('TRANSLATION', 'FLAG');

-- CreateEnum
CREATE TYPE "FlagType" AS ENUM ('BOOLEAN', 'STRING', 'NUMBER', 'JSON');

-- CreateEnum
CREATE TYPE "FlagVisibility" AS ENUM ('PUBLIC', 'SERVER_ONLY');

-- CreateEnum
CREATE TYPE "FlagRuleOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'CONTAINS', 'NOT_CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'GREATER_THAN', 'LESS_THAN');

-- CreateTable
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isProduction" BOOLEAN NOT NULL DEFAULT false,
    "liveVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Version" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "message" TEXT,
    "createdBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "flagsSnapshot" JSONB,
    "promotedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionLocaleBundle" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "translations" JSONB NOT NULL,
    "keyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionLocaleBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionChange" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "entityType" "VersionChangeEntityType" NOT NULL,
    "entityKey" TEXT NOT NULL,
    "locale" TEXT,
    "before" JSONB,
    "after" JSONB,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "FlagType" NOT NULL DEFAULT 'BOOLEAN',
    "visibility" "FlagVisibility" NOT NULL DEFAULT 'PUBLIC',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlagEnvironmentConfig" (
    "id" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" JSONB NOT NULL,
    "offValue" JSONB NOT NULL,
    "rolloutPercentage" INTEGER,
    "rolloutSalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlagEnvironmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlagRule" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "attribute" TEXT NOT NULL,
    "operator" "FlagRuleOperator" NOT NULL,
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "value" JSONB NOT NULL,
    "rolloutPercentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlagRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Environment_liveVersionId_key" ON "Environment"("liveVersionId");

-- CreateIndex
CREATE INDEX "Environment_projectId_idx" ON "Environment"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Environment_projectId_slug_key" ON "Environment"("projectId", "slug");

-- CreateIndex
CREATE INDEX "Version_environmentId_idx" ON "Version"("environmentId");

-- CreateIndex
CREATE INDEX "Version_environmentId_status_idx" ON "Version"("environmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Version_environmentId_number_key" ON "Version"("environmentId", "number");

-- CreateIndex
CREATE INDEX "VersionLocaleBundle_versionId_idx" ON "VersionLocaleBundle"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "VersionLocaleBundle_versionId_locale_key" ON "VersionLocaleBundle"("versionId", "locale");

-- CreateIndex
CREATE INDEX "VersionChange_versionId_idx" ON "VersionChange"("versionId");

-- CreateIndex
CREATE INDEX "VersionChange_versionId_entityType_idx" ON "VersionChange"("versionId", "entityType");

-- CreateIndex
CREATE INDEX "FeatureFlag_projectId_idx" ON "FeatureFlag"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_projectId_key_key" ON "FeatureFlag"("projectId", "key");

-- CreateIndex
CREATE INDEX "FlagEnvironmentConfig_environmentId_idx" ON "FlagEnvironmentConfig"("environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FlagEnvironmentConfig_flagId_environmentId_key" ON "FlagEnvironmentConfig"("flagId", "environmentId");

-- CreateIndex
CREATE INDEX "FlagRule_configId_idx" ON "FlagRule"("configId");

-- CreateIndex
CREATE INDEX "FlagRule_configId_order_idx" ON "FlagRule"("configId", "order");

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_liveVersionId_fkey" FOREIGN KEY ("liveVersionId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_promotedFromId_fkey" FOREIGN KEY ("promotedFromId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionLocaleBundle" ADD CONSTRAINT "VersionLocaleBundle_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionChange" ADD CONSTRAINT "VersionChange_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlagEnvironmentConfig" ADD CONSTRAINT "FlagEnvironmentConfig_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlagEnvironmentConfig" ADD CONSTRAINT "FlagEnvironmentConfig_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlagRule" ADD CONSTRAINT "FlagRule_configId_fkey" FOREIGN KEY ("configId") REFERENCES "FlagEnvironmentConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: scope API keys to a project/environment. Existing keys stay
-- unbound and resolve to the project's production environment.
ALTER TABLE "ApiKey" ADD COLUMN "projectId" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "environmentId" TEXT;

-- CreateIndex
CREATE INDEX "ApiKey_environmentId_idx" ON "ApiKey"("environmentId");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: give every existing project a production environment.
INSERT INTO "Environment" ("id", "projectId", "slug", "name", "isProduction", "createdAt", "updatedAt")
SELECT gen_random_uuid(), p."id", 'production', 'Production', true, NOW(), NOW()
FROM "TranslationProject" p;

-- AlterTable: make translations environment-scoped.
ALTER TABLE "Translation" ADD COLUMN "environmentId" TEXT;

UPDATE "Translation" t
SET "environmentId" = e."id"
FROM "TranslationKey" k
JOIN "Environment" e ON e."projectId" = k."projectId" AND e."isProduction" = true
WHERE t."translationKeyId" = k."id";

-- Rows whose key no longer exists cannot be scoped to an environment.
DELETE FROM "Translation" WHERE "environmentId" IS NULL;

ALTER TABLE "Translation" ALTER COLUMN "environmentId" SET NOT NULL;

-- DropIndex: the old uniqueness assumed a single live universe per project.
DROP INDEX "Translation_translationKeyId_locale_key";

-- CreateIndex
CREATE UNIQUE INDEX "Translation_translationKeyId_environmentId_locale_key" ON "Translation"("translationKeyId", "environmentId", "locale");

-- CreateIndex
CREATE INDEX "Translation_environmentId_idx" ON "Translation"("environmentId");

-- CreateIndex
CREATE INDEX "Translation_environmentId_locale_idx" ON "Translation"("environmentId", "locale");

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: seal current content as published version 1 for each environment.
INSERT INTO "Version" ("id", "environmentId", "number", "status", "message", "publishedAt", "createdAt", "updatedAt")
SELECT gen_random_uuid(), e."id", 1, 'PUBLISHED', 'Initial version', NOW(), NOW(), NOW()
FROM "Environment" e;

-- Backfill: snapshot one bundle per configured locale. Mirrors the previous
-- live bundle builder, where a missing cell falls back to the key source text
-- only for the source locale.
INSERT INTO "VersionLocaleBundle" ("id", "versionId", "locale", "translations", "keyCount", "createdAt")
SELECT
    gen_random_uuid(),
    v."id",
    loc.locale,
    COALESCE(bundle.translations, '{}'::jsonb),
    COALESCE(bundle.key_count, 0),
    NOW()
FROM "Version" v
JOIN "Environment" e ON e."id" = v."environmentId"
JOIN "TranslationProject" p ON p."id" = e."projectId"
CROSS JOIN LATERAL unnest(p."locales") AS loc(locale)
LEFT JOIN LATERAL (
    SELECT
        jsonb_object_agg(k."key", COALESCE(t."value", k."sourceText")) AS translations,
        COUNT(*) AS key_count
    FROM "TranslationKey" k
    LEFT JOIN "Translation" t
        ON t."translationKeyId" = k."id"
       AND t."environmentId" = e."id"
       AND t."locale" = loc.locale
    WHERE k."projectId" = p."id"
      AND (t."id" IS NOT NULL OR loc.locale = p."sourceLocale")
) bundle ON true;

-- Point each environment at its published version.
UPDATE "Environment" e
SET "liveVersionId" = v."id"
FROM "Version" v
WHERE v."environmentId" = e."id" AND v."number" = 1;
