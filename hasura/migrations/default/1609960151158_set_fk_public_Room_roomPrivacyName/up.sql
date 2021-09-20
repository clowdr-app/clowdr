alter table "public"."Room"
           add constraint "Room_roomPrivacyName_fkey"
           foreign key ("roomPrivacyName")
           references "public"."RoomPrivacy"
           ("name") on update cascade on delete restrict;
