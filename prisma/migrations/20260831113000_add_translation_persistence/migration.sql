-- CreateEnum
CREATE TYPE "TranslationSource" AS ENUM ('ai', 'manual', 'code');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('ai', 'manual', 'source', 'needs-review');

-- CreateTable
CREATE TABLE "TranslationProject" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceLocale" TEXT NOT NULL,
    "locales" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationKey" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "translationKeyId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" "TranslationSource" NOT NULL,
    "aiLocked" BOOLEAN NOT NULL DEFAULT false,
    "status" "TranslationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TranslationProject_teamId_name_key" ON "TranslationProject"("teamId", "name");

-- CreateIndex
CREATE INDEX "TranslationProject_teamId_idx" ON "TranslationProject"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationKey_projectId_key_key" ON "TranslationKey"("projectId", "key");

-- CreateIndex
CREATE INDEX "TranslationKey_projectId_idx" ON "TranslationKey"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_translationKeyId_locale_key" ON "Translation"("translationKeyId", "locale");

-- CreateIndex
CREATE INDEX "Translation_translationKeyId_idx" ON "Translation"("translationKeyId");

-- CreateIndex
CREATE INDEX "Translation_locale_idx" ON "Translation"("locale");

-- CreateIndex
CREATE INDEX "Translation_status_idx" ON "Translation"("status");

-- AddForeignKey
ALTER TABLE "TranslationProject" ADD CONSTRAINT "TranslationProject_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationKey" ADD CONSTRAINT "TranslationKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_translationKeyId_fkey" FOREIGN KEY ("translationKeyId") REFERENCES "TranslationKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
