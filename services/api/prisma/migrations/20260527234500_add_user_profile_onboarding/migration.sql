-- Personal details + onboarding signals on User.

CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');
CREATE TYPE "UnitPreference" AS ENUM ('METRIC', 'IMPERIAL');
CREATE TYPE "PrimaryGoal" AS ENUM ('LOSE_WEIGHT', 'BUILD_FITNESS', 'BETTER_SLEEP', 'MENTAL_WELLNESS', 'EAT_BETTER', 'BREAK_HABIT', 'GENERAL_WELLNESS');

ALTER TABLE "User"
  ADD COLUMN "gender"                "Gender",
  ADD COLUMN "dateOfBirth"           DATE,
  ADD COLUMN "heightCm"              INTEGER,
  ADD COLUMN "weightKg"             DOUBLE PRECISION,
  ADD COLUMN "unitPreference"        "UnitPreference" NOT NULL DEFAULT 'METRIC',
  ADD COLUMN "primaryGoal"           "PrimaryGoal",
  ADD COLUMN "interestCategoryIds"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "dailyMinutes"          INTEGER,
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
