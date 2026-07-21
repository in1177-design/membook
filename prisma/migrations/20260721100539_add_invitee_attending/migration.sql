-- CreateEnum
CREATE TYPE "AttendingStatus" AS ENUM ('YES', 'NO', 'MAYBE');

-- AlterTable
ALTER TABLE "Invitee" ADD COLUMN     "attending" "AttendingStatus";
