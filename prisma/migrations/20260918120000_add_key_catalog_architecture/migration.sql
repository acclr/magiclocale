-- AlterTable
ALTER TABLE "Translation" ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Environment" ADD COLUMN "parentEnvironmentId" TEXT;

-- AlterTable
ALTER TABLE "VersionChange" ADD COLUMN "reason" TEXT;

-- AlterTable
ALTER TABLE "FlagEnvironmentConfig" ADD COLUMN "inherited" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "KeyType" AS ENUM ('TRANSLATION', 'FEATURE_FLAG');

-- CreateEnum
CREATE TYPE "KeyLifecycle" AS ENUM ('ACTIVE', 'UNUSED', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FindingKind" AS ENUM ('UNUSED_KEY', 'STALE_FLAG', 'DUPLICATE_TRANSLATION', 'OVERLAPPING_FLAGS', 'NAMESPACE_INCONSISTENCY', 'MISSING_OWNER', 'MISSING_DESCRIPTION', 'NAMING_ISSUE', 'UNKNOWN_FLAG', 'TEMPORARY_FLAG_OVERDUE');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'REVIEWED', 'IGNORED', 'INTENTIONAL');

-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('DRAFT', 'READY', 'APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MigrationOperationType" AS ENUM ('RENAME_KEY', 'MOVE_KEY', 'MERGE_TRANSLATIONS', 'DEPRECATE_KEY', 'ARCHIVE_KEY', 'DELETE_KEY', 'ASSIGN_OWNER');

-- CreateTable
CREATE TABLE "KeyMeta" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "KeyType" NOT NULL,
    "key" TEXT NOT NULL,
    "namespace" TEXT,
    "description" TEXT,
    "developerNote" TEXT,
    "owner" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lifecycle" "KeyLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "lastDetectedAt" TIMESTAMP(3),
    "replacementKey" TEXT,
    "reviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceUsage" (
    "id" TEXT NOT NULL,
    "keyMetaId" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "column" INTEGER,
    "repository" TEXT,
    "branch" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyType" "KeyType",
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchitectureRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureFinding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyMetaId" TEXT,
    "kind" "FindingKind" NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchitectureFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyMigration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MigrationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyMigration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyMigrationOperation" (
    "id" TEXT NOT NULL,
    "migrationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "MigrationOperationType" NOT NULL,
    "keyType" "KeyType" NOT NULL,
    "fromKey" TEXT NOT NULL,
    "toKey" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeyMigrationOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeyMeta_projectId_type_key_key" ON "KeyMeta"("projectId", "type", "key");

-- CreateIndex
CREATE INDEX "KeyMeta_projectId_idx" ON "KeyMeta"("projectId");

-- CreateIndex
CREATE INDEX "KeyMeta_projectId_type_idx" ON "KeyMeta"("projectId", "type");

-- CreateIndex
CREATE INDEX "KeyMeta_projectId_namespace_idx" ON "KeyMeta"("projectId", "namespace");

-- CreateIndex
CREATE INDEX "KeyMeta_projectId_lifecycle_idx" ON "KeyMeta"("projectId", "lifecycle");

-- CreateIndex
CREATE UNIQUE INDEX "SourceUsage_keyMetaId_file_line_column_key" ON "SourceUsage"("keyMetaId", "file", "line", "column");

-- CreateIndex
CREATE INDEX "SourceUsage_keyMetaId_idx" ON "SourceUsage"("keyMetaId");

-- CreateIndex
CREATE INDEX "ArchitectureRule_projectId_idx" ON "ArchitectureRule"("projectId");

-- CreateIndex
CREATE INDEX "ArchitectureFinding_projectId_idx" ON "ArchitectureFinding"("projectId");

-- CreateIndex
CREATE INDEX "ArchitectureFinding_projectId_status_idx" ON "ArchitectureFinding"("projectId", "status");

-- CreateIndex
CREATE INDEX "ArchitectureFinding_keyMetaId_idx" ON "ArchitectureFinding"("keyMetaId");

-- CreateIndex
CREATE INDEX "KeyMigration_projectId_idx" ON "KeyMigration"("projectId");

-- CreateIndex
CREATE INDEX "KeyMigrationOperation_migrationId_idx" ON "KeyMigrationOperation"("migrationId");

-- CreateIndex
CREATE INDEX "KeyMigrationOperation_migrationId_order_idx" ON "KeyMigrationOperation"("migrationId", "order");

-- CreateIndex
CREATE INDEX "Environment_parentEnvironmentId_idx" ON "Environment"("parentEnvironmentId");

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_parentEnvironmentId_fkey" FOREIGN KEY ("parentEnvironmentId") REFERENCES "Environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyMeta" ADD CONSTRAINT "KeyMeta_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceUsage" ADD CONSTRAINT "SourceUsage_keyMetaId_fkey" FOREIGN KEY ("keyMetaId") REFERENCES "KeyMeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureRule" ADD CONSTRAINT "ArchitectureRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureFinding" ADD CONSTRAINT "ArchitectureFinding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureFinding" ADD CONSTRAINT "ArchitectureFinding_keyMetaId_fkey" FOREIGN KEY ("keyMetaId") REFERENCES "KeyMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyMigration" ADD CONSTRAINT "KeyMigration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyMigrationOperation" ADD CONSTRAINT "KeyMigrationOperation_migrationId_fkey" FOREIGN KEY ("migrationId") REFERENCES "KeyMigration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill catalog rows from existing translation keys and feature flags.
INSERT INTO "KeyMeta" ("id", "projectId", "type", "key", "namespace", "description", "lifecycle", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "projectId", 'TRANSLATION', "key",
  CASE WHEN strpos("key", '.') > 0 THEN regexp_replace("key", '\.[^.]+$', '') ELSE NULL END,
  NULL, 'ACTIVE', "createdAt", "updatedAt"
FROM "TranslationKey";

INSERT INTO "KeyMeta" ("id", "projectId", "type", "key", "namespace", "description", "lifecycle", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "projectId", 'FEATURE_FLAG', "key",
  CASE WHEN strpos("key", '.') > 0 THEN regexp_replace("key", '\.[^.]+$', '') ELSE NULL END,
  "description", CASE WHEN "archived" THEN 'ARCHIVED'::"KeyLifecycle" ELSE 'ACTIVE'::"KeyLifecycle" END,
  "createdAt", "updatedAt"
FROM "FeatureFlag";
