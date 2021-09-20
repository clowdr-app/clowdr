alter table "public"."Event"
           add constraint "Event_hallwayId_fkey"
           foreign key ("hallwayId")
           references "public"."Hallway"
           ("id") on update cascade on delete restrict;
