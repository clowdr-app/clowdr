CREATE OR REPLACE FUNCTION delete_room_people_before_room()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
BEGIN
    DELETE FROM "RoomPerson" WHERE "RoomPerson"."roomId" = OLD."id";
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS delete_room_people on "Room";
CREATE TRIGGER delete_room_people BEFORE DELETE ON "Room" FOR EACH ROW EXECUTE PROCEDURE delete_room_people_before_room();
