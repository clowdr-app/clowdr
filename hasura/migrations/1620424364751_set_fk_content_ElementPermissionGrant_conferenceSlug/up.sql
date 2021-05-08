alter table "content"."ElementPermissionGrant"
           add constraint "ElementPermissionGrant_conferenceSlug_fkey"
           foreign key ("conferenceSlug")
           references "conference"."Conference"
           ("slug") on update cascade on delete cascade;
