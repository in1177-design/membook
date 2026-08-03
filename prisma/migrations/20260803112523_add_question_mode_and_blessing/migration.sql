-- CreateEnum
CREATE TYPE "QuestionMode" AS ENUM ('ALL', 'PICK_ONE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "questionMode" "QuestionMode" NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "blessingSignedBy" TEXT,
ADD COLUMN     "blessingText" TEXT;
