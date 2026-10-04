-- AlterTable
ALTER TABLE "Team" ADD COLUMN "inclusive" BOOLEAN NOT NULL DEFAULT false;

-- The company team is inclusive without a paid subscription.
UPDATE "Team" SET "inclusive" = true WHERE "slug" = 'keykit-ab';
