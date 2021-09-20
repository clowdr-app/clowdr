CREATE OR REPLACE FUNCTION "public"."IsProgramRoom" (room "public"."Room")
    RETURNS boolean AS $$
        SELECT EXISTS (SELECT 1 FROM "public"."Event" WHERE "public"."Event"."roomId" = room."id")
    $$ LANGUAGE sql STABLE;
