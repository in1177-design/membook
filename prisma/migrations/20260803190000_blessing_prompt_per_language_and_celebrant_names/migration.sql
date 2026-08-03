-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "celebrantNames" TEXT,
ADD COLUMN     "blessingPromptTextHe" TEXT,
ADD COLUMN     "blessingPromptTextRu" TEXT,
ADD COLUMN     "blessingPromptTextEn" TEXT;

-- Preserve any existing unified blessing prompt text as the Hebrew variant.
UPDATE "Project" SET "blessingPromptTextHe" = "blessingPromptText" WHERE "blessingPromptText" IS NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "blessingPromptText";
