-- AlterTable RQItem: add descripcion, comentario, compraLocal, compraInternacional
ALTER TABLE "RQItem" ADD COLUMN IF NOT EXISTS "descripcion"       TEXT;
ALTER TABLE "RQItem" ADD COLUMN IF NOT EXISTS "comentario"        TEXT;
ALTER TABLE "RQItem" ADD COLUMN IF NOT EXISTS "compraLocal"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RQItem" ADD COLUMN IF NOT EXISTS "compraInternacional" BOOLEAN NOT NULL DEFAULT false;
