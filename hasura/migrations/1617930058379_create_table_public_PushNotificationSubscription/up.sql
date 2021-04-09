CREATE TABLE "public"."PushNotificationSubscription"("created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "userId" Text NOT NULL, "subscription" jsonb NOT NULL, "endpoint" text NOT NULL, PRIMARY KEY ("endpoint") , FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("endpoint"));
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
CREATE TRIGGER "set_public_PushNotificationSubscription_updated_at"
BEFORE UPDATE ON "public"."PushNotificationSubscription"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_PushNotificationSubscription_updated_at" ON "public"."PushNotificationSubscription" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
