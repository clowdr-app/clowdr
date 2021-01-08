CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "chat"."Chat"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "enableAutoPin" boolean NOT NULL DEFAULT false, "enableAutoSubscribe" boolean NOT NULL DEFAULT false, "enableMandatoryPin" Boolean NOT NULL DEFAULT false, "enableMandatorySubscribe" boolean NOT NULL DEFAULT false, "conferenceId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE restrict);
CREATE OR REPLACE FUNCTION "chat"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_chat_Chat_updated_at"
BEFORE UPDATE ON "chat"."Chat"
FOR EACH ROW
EXECUTE PROCEDURE "chat"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_chat_Chat_updated_at" ON "chat"."Chat" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
