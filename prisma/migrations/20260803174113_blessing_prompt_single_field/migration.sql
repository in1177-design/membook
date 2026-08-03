/*
  Warnings:

  - You are about to drop the column `blessingPromptTextEn` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `blessingPromptTextHe` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `blessingPromptTextRu` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "blessingPromptTextEn",
DROP COLUMN "blessingPromptTextHe",
DROP COLUMN "blessingPromptTextRu",
ADD COLUMN     "blessingPromptText" TEXT;
