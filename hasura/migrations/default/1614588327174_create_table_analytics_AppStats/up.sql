CREATE TABLE "analytics"."AppStats"("id" serial NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "total_unique_tabs" integer NOT NULL, "total_unique_user_ids" integer NOT NULL, "pages" jsonb, PRIMARY KEY ("id") );
CREATE OR REPLACE FUNCTION "analytics"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_analytics_AppStats_updated_at"
BEFORE UPDATE ON "analytics"."AppStats"
FOR EACH ROW
EXECUTE PROCEDURE "analytics"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_analytics_AppStats_updated_at" ON "analytics"."AppStats" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
