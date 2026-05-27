-- CreateEnum
CREATE TYPE "ChatMessageKind" AS ENUM ('PRESET', 'CELEBRATION');

-- CreateTable
CREATE TABLE "ChallengeChatMessage" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "userId" UUID,
    "kind" "ChatMessageKind" NOT NULL,
    "presetCode" TEXT,
    "body" TEXT,
    "scheduledDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatReaction" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeChatMessage_challengeId_createdAt_idx" ON "ChallengeChatMessage"("challengeId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeChatMessage_challengeId_kind_scheduledDate_key" ON "ChallengeChatMessage"("challengeId", "kind", "scheduledDate");

-- CreateIndex
CREATE INDEX "ChatReaction_messageId_idx" ON "ChatReaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatReaction_messageId_userId_emoji_key" ON "ChatReaction"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "ChallengeChatMessage" ADD CONSTRAINT "ChallengeChatMessage_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeChatMessage" ADD CONSTRAINT "ChallengeChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatReaction" ADD CONSTRAINT "ChatReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChallengeChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatReaction" ADD CONSTRAINT "ChatReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
