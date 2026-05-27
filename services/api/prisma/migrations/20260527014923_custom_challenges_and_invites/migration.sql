-- CreateEnum
CREATE TYPE "ChallengeVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ChallengeInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "visibility" "ChallengeVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "ChallengeInvite" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "invitedById" UUID NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "invitedUserId" UUID,
    "status" "ChallengeInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ChallengeInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeInvite_invitedUserId_idx" ON "ChallengeInvite"("invitedUserId");

-- CreateIndex
CREATE INDEX "ChallengeInvite_invitedEmail_idx" ON "ChallengeInvite"("invitedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeInvite_challengeId_invitedEmail_key" ON "ChallengeInvite"("challengeId", "invitedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_inviteToken_key" ON "Challenge"("inviteToken");

-- CreateIndex
CREATE INDEX "Challenge_createdById_idx" ON "Challenge"("createdById");

-- CreateIndex
CREATE INDEX "Challenge_visibility_idx" ON "Challenge"("visibility");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeInvite" ADD CONSTRAINT "ChallengeInvite_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeInvite" ADD CONSTRAINT "ChallengeInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeInvite" ADD CONSTRAINT "ChallengeInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

