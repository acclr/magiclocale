-- CreateTable
CREATE TABLE "PlanUsage" (
    "id" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "activeKeyHighWater" INTEGER NOT NULL DEFAULT 0,
    "billedOverageBlocks" INTEGER NOT NULL DEFAULT 0,
    "liveRequests" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,

    CONSTRAINT "PlanUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanUsage_scopeId_period_key" ON "PlanUsage"("scopeId", "period");
