BEGIN TRANSACTION;
ALTER TABLE "conference"."Configuration" DROP CONSTRAINT IF EXISTS "Configuration_pkey";

ALTER TABLE "conference"."Configuration"
    ADD CONSTRAINT "Configuration_pkey" PRIMARY KEY ("key", "conferenceId");
COMMIT TRANSACTION;
