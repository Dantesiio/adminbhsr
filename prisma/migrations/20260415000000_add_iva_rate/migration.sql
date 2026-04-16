-- AlterTable: Add ivaRate column to RQ with default 0
ALTER TABLE "RQ" ADD COLUMN IF NOT EXISTS "ivaRate" DECIMAL(5,2) NOT NULL DEFAULT 0;
