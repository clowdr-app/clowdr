ALTER TABLE "public"."EventPerson" ADD COLUMN "conferenceId" uuid;
ALTER TABLE "public"."EventPerson" ALTER COLUMN "conferenceId" DROP NOT NULL;
ALTER TABLE "public"."EventPerson" ADD CONSTRAINT EventPerson_conferenceId_fkey FOREIGN KEY (conferenceId) REFERENCES "public"."Conference" (id) ON DELETE cascade ON UPDATE cascade;
