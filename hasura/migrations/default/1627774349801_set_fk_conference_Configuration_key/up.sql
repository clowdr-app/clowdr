alter table "conference"."Configuration"
  add constraint "Configuration_key_fkey"
  foreign key ("key")
  references "conference"."ConfigurationKey"
  ("name") on update cascade on delete restrict;
