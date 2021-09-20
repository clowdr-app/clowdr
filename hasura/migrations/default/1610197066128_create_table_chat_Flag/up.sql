CREATE TABLE "chat"."Flag"("id" serial NOT NULL, "type" text NOT NULL, "messageId" integer NOT NULL, "flaggedById" UUID, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "resolved_at" timestamptz, "resolution" text, "notes" text, "discussionChatId" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("type") REFERENCES "chat"."FlagType"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("messageId") REFERENCES "chat"."Message"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("flaggedById") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("discussionChatId") REFERENCES "chat"."Chat"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("messageId", "flaggedById", "type"));
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
CREATE TRIGGER "set_chat_Flag_updated_at"
BEFORE UPDATE ON "chat"."Flag"
FOR EACH ROW
EXECUTE PROCEDURE "chat"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_chat_Flag_updated_at" ON "chat"."Flag" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
