ALTER FUNCTION "chat"."attendee_has_access_to_chat"
    RENAME TO "canAccessChat";

ALTER FUNCTION "chat"."delete_pins_subs_for_room_person"
    RENAME TO "deletePinsSubsForRoomPerson";
DROP TRIGGER delete_pins_subs on "room"."RoomPerson";
CREATE TRIGGER "deletePinsSubs" AFTER DELETE ON "room"."RoomPerson"
    FOR EACH ROW EXECUTE PROCEDURE "chat"."deletePinsSubsForRoomPerson"();

ALTER FUNCTION "chat"."generate_chat"
    RENAME TO "generateChat";
DROP TRIGGER insert_chat on "room"."Room";
DROP TRIGGER insert_chat on "content"."Item";
CREATE TRIGGER "insertChat" BEFORE INSERT ON "room"."Room"
    FOR EACH ROW EXECUTE PROCEDURE "chat"."generateChat"('true');
CREATE TRIGGER "insertChat" BEFORE INSERT ON "content"."Item"
    FOR EACH ROW EXECUTE PROCEDURE "chat"."generateChat"('false');

ALTER FUNCTION "chat"."generate_pins_subs_for_new_attendee"
    RENAME TO "generatePinsSubsForNewRegistrant";
DROP TRIGGER created_generate_pins_subs ON "registrant"."Registrant";
CREATE TRIGGER "createdGeneratePinsSubs" AFTER INSERT ON "registrant"."Registrant" 
    FOR EACH ROW EXECUTE PROCEDURE "chat"."generatePinsSubsForNewRegistrant"();

ALTER FUNCTION "chat"."generate_pins_subs_for_new_chat"
    RENAME TO "generatePinsSubsForNewChat";
DROP TRIGGER generate_pins_subs on "chat"."Chat";
CREATE TRIGGER "generatePinsSubs" AFTER INSERT ON "chat"."Chat" 
    FOR EACH ROW EXECUTE PROCEDURE "chat"."generatePinsSubsForNewChat"();

ALTER FUNCTION "chat"."generate_pins_subs_for_new_room_person"
    RENAME TO "generatePinsSubsForNewRoomPerson";
DROP TRIGGER generate_pins_subs on "room"."RoomPerson";
CREATE TRIGGER "generatePinsSubs" AFTER INSERT ON "room"."RoomPerson" 
    FOR EACH ROW EXECUTE PROCEDURE "chat"."generatePinsSubsForNewRoomPerson"();

ALTER FUNCTION "chat"."on_insert_message"
    RENAME TO "onInsertMessage";
DROP TRIGGER duplication_insert ON "chat"."Message";
CREATE TRIGGER "duplicationInsert" AFTER INSERT ON "chat"."Message" 
    FOR EACH ROW WHEN (pg_trigger_depth() < 1 AND NEW."duplicatedMessageSId" IS NULL)
    EXECUTE PROCEDURE "chat"."onInsertMessage"();

ALTER FUNCTION "chat"."on_insert_reaction"
    RENAME TO "onInsertReaction";
DROP TRIGGER duplication_insert ON "chat"."Reaction";
CREATE TRIGGER "duplicationInsert" AFTER INSERT ON "chat"."Reaction" 
    FOR EACH ROW WHEN (pg_trigger_depth() < 1 AND NEW."duplicateSId" IS NULL)
    EXECUTE PROCEDURE "chat"."onInsertReaction"();

ALTER FUNCTION "chat"."on_update_message"
    RENAME TO "onUpdateMessage";
DROP TRIGGER duplication_update ON "chat"."Message";
CREATE TRIGGER "duplicationUpdate" AFTER UPDATE ON "chat"."Message" 
    FOR EACH ROW WHEN (pg_trigger_depth() < 1 AND NEW."duplicatedMessageSId" IS NOT NULL)
    EXECUTE PROCEDURE "chat"."onUpdateMessage"();

ALTER FUNCTION "chat"."on_update_reaction"
    RENAME TO "onUpdateReaction";
DROP TRIGGER duplication_update ON "chat"."Reaction";
CREATE TRIGGER "duplicationUpdate" AFTER UPDATE ON "chat"."Reaction" 
    FOR EACH ROW WHEN (pg_trigger_depth() < 1 AND NEW."duplicateSId" IS NOT NULL)
    EXECUTE PROCEDURE "chat"."onUpdateReaction"();

ALTER FUNCTION "chat"."prevent_delete_mandatory_pin"
    RENAME TO "preventDeleteMandatoryPin";
DROP TRIGGER prevent_delete_pins ON chat."Pin";
CREATE TRIGGER "preventDeletePins" BEFORE DELETE ON chat."Pin" 
    FOR EACH ROW EXECUTE PROCEDURE chat."preventDeleteMandatoryPin"();

ALTER FUNCTION "chat"."prevent_delete_mandatory_sub"
    RENAME TO "preventDeleteMandatorySub";
DROP TRIGGER prevent_delete_subs ON chat."Subscription";
CREATE TRIGGER "preventDeleteSubs" BEFORE DELETE ON chat."Subscription"
    FOR EACH ROW EXECUTE PROCEDURE "chat"."preventDeleteMandatorySub"();

ALTER FUNCTION "chat"."update_pins_subs_for_chat"
    RENAME TO "updatePinsSubsForChat";
DROP TRIGGER update_pins_subs on "chat"."Chat";
CREATE TRIGGER "updatePinsSubs" AFTER UPDATE ON "chat"."Chat" 
    FOR EACH ROW WHEN (OLD."enableAutoPin" != NEW."enableAutoPin"
                    OR OLD."enableMandatoryPin" != NEW."enableMandatoryPin"
                    OR OLD."enableAutoSubscribe" != NEW."enableAutoSubscribe"
                    OR OLD."enableMandatorySubscribe" != NEW."enableMandatorySubscribe"
                    )
    EXECUTE PROCEDURE "chat"."updatePinsSubsForChat"();

ALTER FUNCTION "chat"."update_pins_subs_for_room_or_contentgroup"
    RENAME TO "updatePinsSubsForRoomOrItem";
DROP TRIGGER update_pins_subs on "room"."Room";
CREATE TRIGGER "updatePinsSubs" AFTER UPDATE ON "room"."Room" 
    FOR EACH ROW WHEN (OLD."chatId" != NEW."chatId") 
    EXECUTE PROCEDURE chat."updatePinsSubsForRoomOrItem"();
DROP TRIGGER update_pins_subs on "content"."Item";
CREATE TRIGGER "updatePinsSubs" AFTER UPDATE ON "content"."Item"
    FOR EACH ROW WHEN (OLD."chatId" != NEW."chatId") 
    EXECUTE PROCEDURE chat."updatePinsSubsForRoomOrItem"();
