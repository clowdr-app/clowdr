alter table "chat"."Flag" drop constraint "Flag_messageSId_flaggedById_type_key";
alter table "chat"."Flag" add constraint "Flag_messageId_flaggedById_type_key" unique ("messageId", "flaggedById", "type");
