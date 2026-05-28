-- Data minimisation: replace the full date-of-birth with year-of-birth
-- only. The precise day+month is the identity-grade part of a DOB; the
-- year alone is enough to gate under-13 signups and show an approximate
-- age. Any previously stored dates are intentionally dropped.
ALTER TABLE "User" ADD COLUMN "birthYear" INTEGER;
ALTER TABLE "User" DROP COLUMN "dateOfBirth";
