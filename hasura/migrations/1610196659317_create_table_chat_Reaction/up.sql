CREATE TABLE "chat"."Reaction"("id" serial NOT NULL, "type" text NOT NULL, "messageId" integer NOT NULL, "senderId" uuid NOT NULL, "symbol" text NOT NULL, "data" jsonb NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("type") REFERENCES "chat"."ReactionType"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("messageId") REFERENCES "chat"."Message"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("senderId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"));
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
CREATE TRIGGER "set_chat_Reaction_updated_at"
BEFORE UPDATE ON "chat"."Reaction"
FOR EACH ROW
EXECUTE PROCEDURE "chat"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_chat_Reaction_updated_at" ON "chat"."Reaction" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
