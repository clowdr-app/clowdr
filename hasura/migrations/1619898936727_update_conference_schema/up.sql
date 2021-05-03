DROP INDEX "conference"."creator_id";
DROP INDEX "conference"."slug";
ALTER TRIGGER "set_public_Conference_updated_at" ON "conference"."Conference"
    RENAME TO "set_conference_Conference_updated_at";


ALTER TABLE "conference"."Configuration"
    RENAME CONSTRAINT "ConferenceConfiguration_conferenceId_fkey" to "Configuration_conferenceId_fkey";
ALTER TABLE "conference"."Configuration"
    RENAME CONSTRAINT "ConferenceConfiguration_conferenceId_key_key" to "Configuration_conferenceId_key_key";
ALTER TABLE "conference"."Configuration"
    RENAME CONSTRAINT "ConferenceConfiguration_pkey" to "Configuration_pkey";
CREATE INDEX "conference_Configuration_conferenceId" ON "conference"."Configuration" ("conferenceId");
CREATE INDEX "conference_Configuration_key" ON "conference"."Configuration" ("key");
ALTER TRIGGER "set_public_ConferenceConfiguration_updated_at" ON "conference"."Configuration"
    RENAME TO "set_conference_Configuration_updated_at";


ALTER TABLE "conference"."DemoCode"
    RENAME CONSTRAINT "ConferenceDemoCodes_pkey" to "DemoCode_pkey";
ALTER TABLE "conference"."DemoCode"
    RENAME CONSTRAINT "ConferenceDemoCodes_usedById_fkey" to "DemoCode_usedById_fkey";
ALTER TRIGGER "set_public_ConferenceDemoCode_updated_at" ON "conference"."DemoCode"
    RENAME TO "set_conference_DemoCode_updated_at";

ALTER TRIGGER "set_public_OriginatingData_updated_at" ON "conference"."OriginatingData"
    RENAME TO "set_conference_OriginatingData_updated_at";


ALTER TABLE "conference"."PrepareJob"
    RENAME CONSTRAINT "ConferencePrepareJob_conferenceId_fkey" to "PrepareJob_conferenceId_fkey";
ALTER TABLE "conference"."PrepareJob"
    RENAME CONSTRAINT "ConferencePrepareJob_jobStatusName_fkey" to "PrepareJob_jobStatusName_fkey";
ALTER TABLE "conference"."PrepareJob"
    RENAME CONSTRAINT "ConferencePrepareJob_pkey" to "PrepareJob_pkey";

ALTER INDEX "conference"."conferencepreparejob_conference_id" RENAME TO "conference_PrepareJob_conferenceId";

ALTER TRIGGER "set_public_ConferencePrepareJob_updated_at" ON "conference"."PrepareJob"
    RENAME TO "set_conference_PrepareJob_updated_at";
