alter table "registrant"."Registrant"
  add constraint "Registrant_conferenceRole_fkey"
  foreign key ("conferenceRole")
  references "registrant"."RegistrantRole"
  ("name") on update cascade on delete restrict;
