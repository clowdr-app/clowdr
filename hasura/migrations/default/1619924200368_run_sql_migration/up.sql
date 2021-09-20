ALTER TABLE "room"."RoomPerson"
    RENAME CONSTRAINT "RoomPerson_attendeeId_fkey" TO "RoomPerson_registrantId_fkey";
ALTER TABLE "room"."RoomPerson"
    RENAME CONSTRAINT "RoomPerson_attendeeId_roomId_key" TO "RoomPerson_registrantId_roomId_key";
