-- Admin moderation: suspend/reactivate accounts.
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
