CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ContentItem"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "contentTypeName" Text NOT NULL, "contentGroupId" uuid NOT NULL, "requiredContentId" UUID, "name" text NOT NULL, "data" jsonb NOT NULL, "isHidden" boolean NOT NULL DEFAULT false, "originatingDataId" uuid, "layoutData" jsonb, PRIMARY KEY ("id") , FOREIGN KEY ("contentTypeName") REFERENCES "public"."ContentType"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("contentGroupId") REFERENCES "public"."ContentGroup"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("requiredContentId") REFERENCES "public"."RequiredContentItem"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("originatingDataId") REFERENCES "public"."OriginatingData"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("requiredContentId"));
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
CREATE TRIGGER "set_public_ContentItem_updated_at"
BEFORE UPDATE ON "public"."ContentItem"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ContentItem_updated_at" ON "public"."ContentItem" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
