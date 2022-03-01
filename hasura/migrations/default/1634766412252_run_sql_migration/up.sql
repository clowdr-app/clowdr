CREATE FUNCTION "schedule"."eventRoomName"(event_row "schedule"."Event")
RETURNS TEXT AS $$
  SELECT "name" FROM "room"."Room" WHERE "room"."Room"."id" = event_row."roomId"
$$ LANGUAGE sql STABLE;
