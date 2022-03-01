alter table "chat"."Flag" add constraint "Flag_flaggedById_messageSId_type_key" unique ("flaggedById", "messageSId", "type");
