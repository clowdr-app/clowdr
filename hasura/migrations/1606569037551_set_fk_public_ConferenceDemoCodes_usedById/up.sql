alter table "public"."ConferenceDemoCodes"
           add constraint "ConferenceDemoCodes_usedById_fkey"
           foreign key ("usedById")
           references "public"."User"
           ("id") on update cascade on delete cascade;
