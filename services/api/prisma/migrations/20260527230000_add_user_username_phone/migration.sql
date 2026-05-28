-- Add Instagram-style username and E.164 phone fields to User.
-- Both are nullable + unique. The application enforces username
-- presence on new signups; existing rows are backfilled by the
-- seed scripts.

ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "phone"    TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_phone_key"    ON "User"("phone");
