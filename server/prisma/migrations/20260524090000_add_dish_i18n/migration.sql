-- Add bilingual fields for dishes and dish snapshots
ALTER TABLE "Dish" ADD COLUMN "nameEn" TEXT;
ALTER TABLE "Dish" ADD COLUMN "descriptionEn" TEXT;

ALTER TABLE "DishSnapshot" ADD COLUMN "nameEn" TEXT;
ALTER TABLE "DishSnapshot" ADD COLUMN "descriptionEn" TEXT;

-- Backfill existing rows so English fallback has values immediately
UPDATE "Dish"
SET "nameEn" = "name", "descriptionEn" = "description"
WHERE "nameEn" IS NULL OR "descriptionEn" IS NULL;

UPDATE "DishSnapshot"
SET "nameEn" = "name", "descriptionEn" = "description"
WHERE "nameEn" IS NULL OR "descriptionEn" IS NULL;
