alter table "public"."OriginatingData" add constraint "OriginatingData_sourceId_conferenceId_key" unique ("sourceId", "conferenceId");
