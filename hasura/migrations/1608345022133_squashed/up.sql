
CREATE TABLE "public"."JobStatus"("name" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("name") );

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ConferencePrepareJob"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "jobStatusName" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("jobStatusName") REFERENCES "public"."JobStatus"("name") ON UPDATE cascade ON DELETE restrict);
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_ConferencePrepareJob_updated_at"
BEFORE UPDATE ON "public"."ConferencePrepareJob"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ConferencePrepareJob_updated_at" ON "public"."ConferencePrepareJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."VideoRenderJob"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "conferencePrepareJobId" uuid NOT NULL, "jobStatusName" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("conferencePrepareJobId") REFERENCES "public"."ConferencePrepareJob"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("jobStatusName") REFERENCES "public"."JobStatus"("name") ON UPDATE cascade ON DELETE restrict);
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_VideoRenderJob_updated_at"
BEFORE UPDATE ON "public"."VideoRenderJob"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_VideoRenderJob_updated_at" ON "public"."VideoRenderJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."ConferencePrepareJob" ADD COLUMN "conferenceId" uuid NOT NULL;

alter table "public"."ConferencePrepareJob"
           add constraint "ConferencePrepareJob_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."ConferencePrepareJob"
           ("id") on update cascade on delete cascade;

alter table "public"."ConferencePrepareJob" drop constraint "ConferencePrepareJob_conferenceId_fkey",
             add constraint "ConferencePrepareJob_conferenceId_fkey"
             foreign key ("conferenceId")
             references "public"."Conference"
             ("id") on update cascade on delete cascade;

ALTER TABLE ONLY "public"."ConferencePrepareJob" ALTER COLUMN "jobStatusName" SET DEFAULT 'IN_PROGRESS';

ALTER TABLE ONLY "public"."VideoRenderJob" ALTER COLUMN "jobStatusName" SET DEFAULT 'IN_PROGRESS';

ALTER TABLE "public"."VideoRenderJob" ADD COLUMN "conferenceId" uuid NOT NULL;

alter table "public"."VideoRenderJob"
           add constraint "VideoRenderJob_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
