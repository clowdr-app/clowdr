alter table "public"."ChatTyper" add constraint "ChatTyper_chatId_userId_key" unique ("chatId", "userId");
