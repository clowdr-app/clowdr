CREATE OR REPLACE FUNCTION room."deleteRoomPeopleBeforeRoom"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN 
    DELETE FROM "room"."RoomMembership" WHERE "room"."RoomMembership"."roomId" = OLD."id";
    RETURN OLD;
END;
$BODY$;
