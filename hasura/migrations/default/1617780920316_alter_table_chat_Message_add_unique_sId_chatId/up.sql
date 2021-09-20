alter table "chat"."Message" add constraint "Message_sId_chatId_key" unique ("sId", "chatId");
