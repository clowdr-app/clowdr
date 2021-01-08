CREATE TABLE "chat"."Message"("id" serial NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "type" text NOT NULL, "chatId" uuid NOT NULL, "senderId" uuid, "message" text NOT NULL, "data" jsonb NOT NULL, "duplicatedMessageId" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("type") REFERENCES "chat"."MessageType"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("chatId") REFERENCES "chat"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("senderId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("id"), UNIQUE ("duplicatedMessageId"));
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
CREATE TRIGGER "set_chat_Message_updated_at"
BEFORE UPDATE ON "chat"."Message"
FOR EACH ROW
EXECUTE PROCEDURE "chat"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_chat_Message_updated_at" ON "chat"."Message" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
