alter table "chat"."Subscription"
  add constraint "Subscription_registrantId_chatId_fkey"
  foreign key ("registrantId", "chatId")
  references "chat"."Pin"
  ("registrantId", "chatId") on update restrict on delete restrict;
