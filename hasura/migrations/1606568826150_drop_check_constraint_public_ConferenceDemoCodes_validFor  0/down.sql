alter table "public"."ConferenceDemoCodes" add constraint "validFor > 0" check (CHECK ("validFor" > 0));
