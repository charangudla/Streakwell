-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "ChallengeFriendship" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ChallengeFriendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeFriendship_recipientId_status_idx" ON "ChallengeFriendship"("recipientId", "status");

-- CreateIndex
CREATE INDEX "ChallengeFriendship_requesterId_status_idx" ON "ChallengeFriendship"("requesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeFriendship_requesterId_recipientId_key" ON "ChallengeFriendship"("requesterId", "recipientId");

-- AddForeignKey
ALTER TABLE "ChallengeFriendship" ADD CONSTRAINT "ChallengeFriendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeFriendship" ADD CONSTRAINT "ChallengeFriendship_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
