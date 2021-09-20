ALTER TABLE "public"."EventPerson" ADD COLUMN "name" text;
ALTER TABLE "public"."EventPerson" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "public"."EventPerson" ADD CONSTRAINT EventPerson_eventId_name_affiliation_key UNIQUE (eventId, name, affiliation);
