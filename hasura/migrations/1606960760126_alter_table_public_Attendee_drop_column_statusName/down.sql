ALTER TABLE "public"."Attendee" ADD COLUMN "statusName" text;
ALTER TABLE "public"."Attendee" ALTER COLUMN "statusName" DROP NOT NULL;
ALTER TABLE "public"."Attendee" ADD CONSTRAINT Attendee_status_fkey FOREIGN KEY (statusName) REFERENCES "public"."AttendeeStatus" (name) ON DELETE restrict ON UPDATE cascade;
