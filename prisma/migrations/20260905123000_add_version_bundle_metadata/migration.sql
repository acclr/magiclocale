-- Promotion has to distinguish an AI-written cell from a human-written one in
-- the incoming snapshot, which the flat `key -> value` serving map cannot
-- express. Store that authoring metadata alongside it.
ALTER TABLE "VersionLocaleBundle" ADD COLUMN "metadata" JSONB;

-- Backfilled snapshots predate promotion, so derive their metadata from the
-- working copy the snapshot was taken from.
UPDATE "VersionLocaleBundle" b
SET "metadata" = derived.metadata
FROM (
    SELECT
        b2."id" AS bundle_id,
        jsonb_object_agg(
            k."key",
            jsonb_build_object(
                'source', lower(t."source"::text),
                'status', CASE
                    WHEN t."status"::text = 'NEEDS_REVIEW' THEN 'needs-review'
                    ELSE lower(t."status"::text)
                END,
                'aiLocked', t."aiLocked"
            )
        ) AS metadata
    FROM "VersionLocaleBundle" b2
    JOIN "Version" v ON v."id" = b2."versionId"
    JOIN "Environment" e ON e."id" = v."environmentId"
    JOIN "TranslationKey" k ON k."projectId" = e."projectId"
    JOIN "Translation" t
        ON t."translationKeyId" = k."id"
       AND t."environmentId" = e."id"
       AND t."locale" = b2."locale"
    GROUP BY b2."id"
) derived
WHERE b."id" = derived.bundle_id;
