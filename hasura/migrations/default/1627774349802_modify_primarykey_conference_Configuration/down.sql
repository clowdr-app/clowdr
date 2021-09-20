alter table "conference"."Configuration" drop constraint "Configuration_pkey";
alter table "conference"."Configuration"
    add constraint "Configuration_pkey"
    primary key ("id");
