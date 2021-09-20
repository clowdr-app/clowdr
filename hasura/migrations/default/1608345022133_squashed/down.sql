
alter table "public"."VideoRenderJob" drop constraint "VideoRenderJob_conferenceId_fkey";

ALTER TABLE "public"."VideoRenderJob" DROP COLUMN "conferenceId";

ALTER TABLE ONLY "public"."VideoRenderJob" ALTER COLUMN "jobStatusName" DROP DEFAULT;

ALTER TABLE ONLY "public"."ConferencePrepareJob" ALTER COLUMN "jobStatusName" DROP DEFAULT;

alter table "public"."ConferencePrepareJob" drop constraint "ConferencePrepareJob_conferenceId_fkey",
          add constraint "ConferencePrepareJob_conferenceId_fkey"
          foreign key ("conferenceId")
          references "public"."ConferencePrepareJob"
          ("id")
          on update cascade
          on delete cascade;

alter table "public"."ConferencePrepareJob" drop constraint "ConferencePrepareJob_conferenceId_fkey";

ALTER TABLE "public"."ConferencePrepareJob" DROP COLUMN "conferenceId";

DROP TABLE "public"."VideoRenderJob";

DROP TABLE "public"."ConferencePrepareJob";

DROP TABLE "public"."JobStatus";
