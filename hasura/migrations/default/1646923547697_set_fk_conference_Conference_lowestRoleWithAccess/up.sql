alter table "conference"."Conference"
  add constraint "Conference_lowestRoleWithAccess_fkey"
  foreign key ("lowestRoleWithAccess")
  references "registrant"."RegistrantRole"
  ("name") on update cascade on delete restrict;
