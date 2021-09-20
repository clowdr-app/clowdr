ALTER TABLE "public"."EventPerson" ADD COLUMN "attendeeId" uuid;
ALTER TABLE "public"."EventPerson" ALTER COLUMN "attendeeId" DROP NOT NULL;
ALTER TABLE "public"."EventPerson" ADD CONSTRAINT EventPerson_attendeeId_fkey FOREIGN KEY (attendeeId) REFERENCES "public"."Attendee" (id) ON DELETE set null ON UPDATE cascade;
