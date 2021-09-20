ALTER TABLE "chat"."Reaction"
    ADD FOREIGN KEY ("messageSId", "chatId")
    REFERENCES "chat"."Message" ("sId", "chatId")
    ON UPDATE cascade;
