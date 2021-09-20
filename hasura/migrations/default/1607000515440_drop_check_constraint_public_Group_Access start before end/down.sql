alter table "public"."Group" add constraint "Access start before end" check (CHECK ("accessStart" < "accessEnd"));
