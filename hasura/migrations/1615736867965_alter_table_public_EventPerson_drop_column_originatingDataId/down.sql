ALTER TABLE "public"."EventPerson" ADD COLUMN "originatingDataId" uuid;
ALTER TABLE "public"."EventPerson" ALTER COLUMN "originatingDataId" DROP NOT NULL;
ALTER TABLE "public"."EventPerson" ADD CONSTRAINT EventPerson_originatingDataId_fkey FOREIGN KEY (originatingDataId) REFERENCES "public"."OriginatingData" (id) ON DELETE restrict ON UPDATE cascade;
