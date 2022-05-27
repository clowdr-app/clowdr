alter table "registrant"."GoogleAccount"
  add constraint "GoogleAccount_authTokenSubject_fkey"
  foreign key ("authTokenSubject")
  references "public"."GoogleAuthToken"
  ("sub") on update cascade on delete restrict;
