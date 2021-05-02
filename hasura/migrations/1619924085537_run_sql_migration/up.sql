ALTER TABLE "permissions"."GroupRegistrant"
    RENAME CONSTRAINT "GroupAttendee_attendeeId_fkey" TO "GroupRegistrant_registrantId_fkey";
ALTER TABLE "permissions"."GroupRegistrant"
    RENAME CONSTRAINT "GroupAttendee_groupId_fkey" TO "GroupRegistrant_groupId_fkey";
ALTER TABLE "permissions"."GroupRegistrant"
    RENAME CONSTRAINT "GroupAttendee_pkey" TO "GroupRegistrant_pkey";
ALTER TABLE "permissions"."GroupRegistrant"
    RENAME CONSTRAINT "GroupAttendee_groupId_attendeeId_key" TO "GroupRegistrant_groupId_registrantId_key";
