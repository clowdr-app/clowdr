alter table "analytics"."RoomPresence" add constraint "RoomPresence_roomId_created_at_key" unique ("roomId", "created_at");
