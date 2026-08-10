-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "languages" "Language"[] DEFAULT ARRAY['HE']::"Language"[];
