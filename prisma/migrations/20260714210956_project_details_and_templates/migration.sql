-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "introTextEn" TEXT,
ADD COLUMN     "introTextHe" TEXT,
ADD COLUMN     "introTextRu" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "submissionDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuestionTemplate" (
    "id" TEXT NOT NULL,
    "textHe" TEXT NOT NULL,
    "textRu" TEXT,
    "textEn" TEXT,
    "helperTextHe" TEXT,
    "helperTextRu" TEXT,
    "helperTextEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntroTemplate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "textHe" TEXT NOT NULL,
    "textRu" TEXT,
    "textEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntroTemplate_pkey" PRIMARY KEY ("id")
);
