CREATE TABLE "chat"."ReadUpToIndex"("chatId" UUID NOT NULL, "messageId" integer NOT NULL, "attendeeId" uuid NOT NULL, "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("chatId","attendeeId") , FOREIGN KEY ("chatId") REFERENCES "chat"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("messageId") REFERENCES "chat"."Message"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade);
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
CREATE TRIGGER "set_chat_ReadUpToIndex_updated_at"
BEFORE UPDATE ON "chat"."ReadUpToIndex"
FOR EACH ROW
EXECUTE PROCEDURE "chat"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_chat_ReadUpToIndex_updated_at" ON "chat"."ReadUpToIndex" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
