alter table "chat"."Flag"
    add constraint "Flag_messageSId_flaggedById_type_key"
    primary key ("flaggedById", "type", "messageSId");
