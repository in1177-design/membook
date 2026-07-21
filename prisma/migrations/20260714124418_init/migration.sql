-- CreateEnum
CREATE TYPE "Language" AS ENUM ('HE', 'RU', 'EN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT,
    "customerName" TEXT,
    "eventDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultLanguage" "Language" NOT NULL DEFAULT 'HE',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "textHe" TEXT NOT NULL,
    "textRu" TEXT,
    "textEn" TEXT,
    "helperTextHe" TEXT,
    "helperTextRu" TEXT,
    "helperTextEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitee" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "relation" TEXT,
    "language" "Language",
    "name2" TEXT,
    "phone2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteLink" (
    "id" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewLog" (
    "id" TEXT NOT NULL,
    "inviteLinkId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',

    CONSTRAINT "ViewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "Question_projectId_idx" ON "Question"("projectId");

-- CreateIndex
CREATE INDEX "Invitee_projectId_idx" ON "Invitee"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteLink_inviteeId_key" ON "InviteLink"("inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteLink_token_key" ON "InviteLink"("token");

-- CreateIndex
CREATE INDEX "InviteLink_token_idx" ON "InviteLink"("token");

-- CreateIndex
CREATE INDEX "ViewLog_inviteLinkId_idx" ON "ViewLog"("inviteLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_inviteeId_key" ON "Submission"("inviteeId");

-- CreateIndex
CREATE INDEX "Answer_submissionId_idx" ON "Answer"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_submissionId_questionId_key" ON "Answer"("submissionId", "questionId");

-- CreateIndex
CREATE INDEX "MediaAsset_submissionId_idx" ON "MediaAsset"("submissionId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitee" ADD CONSTRAINT "Invitee_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLink" ADD CONSTRAINT "InviteLink_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Invitee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewLog" ADD CONSTRAINT "ViewLog_inviteLinkId_fkey" FOREIGN KEY ("inviteLinkId") REFERENCES "InviteLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Invitee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
