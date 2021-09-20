
ALTER TABLE "public"."User" ALTER COLUMN "updated_at" TYPE timestamp with time zone;
ALTER TABLE "public"."User" ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "public"."User" ALTER COLUMN "created_at" DROP NOT NULL;

DROP TRIGGER IF EXISTS "set_public_RolePermission_updated_at" ON "public"."RolePermission";
ALTER TABLE "public"."RolePermission" DROP COLUMN "updated_at";

ALTER TABLE "public"."RolePermission" DROP COLUMN "created_at";

DROP TRIGGER IF EXISTS "set_public_Role_updated_at" ON "public"."Role";
ALTER TABLE "public"."Role" DROP COLUMN "updated_at";

ALTER TABLE "public"."Role" DROP COLUMN "created_at";

DROP TRIGGER IF EXISTS "set_public_OnlineStatus_updated_at" ON "public"."OnlineStatus";
ALTER TABLE "public"."OnlineStatus" DROP COLUMN "updated_at";

ALTER TABLE "public"."OnlineStatus" DROP COLUMN "created_at";

DROP TRIGGER IF EXISTS "set_public_GroupRole_updated_at" ON "public"."GroupRole";
ALTER TABLE "public"."GroupRole" DROP COLUMN "updated_at";

ALTER TABLE "public"."GroupRole" DROP COLUMN "created_at";

DROP TRIGGER IF EXISTS "set_public_GroupAttendee_updated_at" ON "public"."GroupAttendee";
ALTER TABLE "public"."GroupAttendee" DROP COLUMN "updated_at";

ALTER TABLE "public"."GroupAttendee" DROP COLUMN "created_at";

ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "updated_at" DROP NOT NULL;

DROP TRIGGER IF EXISTS "set_public_Group_updated_at" ON "public"."Group";
ALTER TABLE "public"."Group" DROP COLUMN "updated_at";

ALTER TABLE "public"."Group" DROP COLUMN "created_at";

DROP TRIGGER IF EXISTS "set_public_ConferenceDemoCode_updated_at" ON "public"."ConferenceDemoCode";
ALTER TABLE "public"."ConferenceDemoCode" DROP COLUMN "updated_at";

ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "created_at" DROP NOT NULL;

ALTER TABLE "public"."ConferenceDemoCode" DROP COLUMN "created_at";

ALTER TABLE "public"."ConferenceDemoCode" ADD COLUMN "updatedAt" timestamptz;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "updatedAt" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "updatedAt" SET DEFAULT now();

ALTER TABLE "public"."ConferenceDemoCode" ADD COLUMN "createdAt" timestamptz;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "createdAt" SET DEFAULT now();

alter table "public"."Attendee" rename column "created_at" to "createdAt";

alter table "public"."Attendee" rename column "updated_at" to "updatedAt";

alter table "public"."Attendee" rename column "updatedAt" to "updated_at";

alter table "public"."Attendee" rename column "createdAt" to "created_at";

DROP TRIGGER IF EXISTS "set_public_Conference_updated_at" ON "public"."Conference";
ALTER TABLE "public"."Conference" DROP COLUMN "updated_at";

ALTER TABLE "public"."Conference" DROP COLUMN "created_at";

ALTER TABLE "public"."Conference" ADD COLUMN "updatedAt" timestamptz;
ALTER TABLE "public"."Conference" ALTER COLUMN "updatedAt" DROP NOT NULL;
ALTER TABLE "public"."Conference" ALTER COLUMN "updatedAt" SET DEFAULT now();

ALTER TABLE "public"."Conference" ADD COLUMN "createdAt" timestamptz;
ALTER TABLE "public"."Conference" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "public"."Conference" ALTER COLUMN "createdAt" SET DEFAULT now();

DROP TRIGGER IF EXISTS "set_public_Attendee_updated_at" ON "public"."Attendee";
ALTER TABLE "public"."Attendee" DROP COLUMN "updated_at";

ALTER TABLE "public"."Attendee" DROP COLUMN "created_at";

alter table "public"."Attendee" drop constraint "Attendee_conferenceId_userId_key";

alter table "public"."ConferenceDemoCode" rename to "ConferenceDemoCodes";

alter table "public"."Conference" drop constraint "Conference_demoCodeId_key";

ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "used" bool;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "used" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "used" SET DEFAULT false;

alter table "public"."Conference" drop constraint "Conference_demoCodeId_fkey";

ALTER TABLE "public"."Conference" DROP COLUMN "demoCodeId";

alter table "public"."ConferenceDemoCodes" drop constraint "ConferenceDemoCodes_usedById_fkey";

alter table "public"."ConferenceDemoCodes" rename column "usedById" to "usedBy";

ALTER TABLE "public"."ConferenceDemoCodes" DROP COLUMN "usedBy";

ALTER TABLE "public"."ConferenceDemoCodes" DROP COLUMN "updatedAt";

ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "validUpTo" timestamptz;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validUpTo" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validUpTo" SET DEFAULT now();

ALTER TABLE "public"."ConferenceDemoCodes" DROP COLUMN "validUpTo";

ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "validFor" int8;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validFor" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validFor" SET DEFAULT 1209600000;

alter table "public"."ConferenceDemoCodes" add constraint "validFor > 0" check (CHECK ("validFor" > 0));

ALTER TABLE "public"."ConferenceDemoCodes" DROP COLUMN "used";

DROP TABLE "public"."ConferenceDemoCodes";

DROP VIEW IF EXISTS "ActiveGroup";

alter table "public"."RolePermission" rename column "permissionName" to "permission";

DROP TABLE "public"."GroupAttendee";

alter table "public"."Attendee" rename column "statusName" to "status";

alter table "public"."Attendee" drop constraint "Attendee_status_fkey";

DELETE FROM "AttendeeStatus" where name = 'ACTIVE' OR name = 'BANNED';

DROP TABLE "public"."AttendeeStatus";

DROP TABLE "public"."Attendee";

DELETE FROM "Permission" where name = 'CONFERENCE_MANAGE_ROLES' or name = 'CONFERENCE_MANAGE_GROUPS';

DROP TABLE "public"."GroupRole";

DROP TABLE "public"."Group";

alter table "public"."RolePermission" drop constraint "RolePermission_roleId_fkey";

alter table "public"."Role" drop constraint "Role_conferenceId_fkey";

alter table "public"."Role" rename column "conferenceId" to "conference";

DROP TABLE "public"."RolePermission";

DROP TABLE "public"."Role";

DELETE FROM "Permission" where name = 'CONFERENCE_MANAGE_NAME' OR name = 'CONFERENCE_MANAGE_ATTENDEES' OR name = 'CONFERENCE_MODERATE_ATTENDEES' OR name = 'CONFERENCE_VIEW_ATTENDEES' OR name = 'CONFERENCE_VIEW';

DROP TABLE "public"."Permission";

ALTER TABLE "public"."User" ADD COLUMN "status" text;
ALTER TABLE "public"."User" ALTER COLUMN "status" DROP NOT NULL;
ALTER TABLE "public"."User" ALTER COLUMN "status" SET DEFAULT 'active'::text;

DROP TABLE "public"."Conference";

alter table "public"."User" rename to "user";

ALTER TABLE "public"."user" ADD COLUMN "username" text;
ALTER TABLE "public"."user" ALTER COLUMN "username" DROP NOT NULL;

alter table "public"."user" drop constraint "user_email_key";

ALTER TABLE "public"."user" DROP COLUMN "status";

ALTER TABLE "public"."Chat" ADD COLUMN "lastMessageIndex" int4;
ALTER TABLE "public"."Chat" ALTER COLUMN "lastMessageIndex" DROP NOT NULL;
ALTER TABLE "public"."Chat" ALTER COLUMN "lastMessageIndex" SET DEFAULT 0;

DROP TABLE "public"."FollowedChat";

DROP TABLE "public"."PinnedChat";

DROP TABLE "public"."ChatUnreadIndex";

ALTER TABLE "public"."user" DROP COLUMN "email";

ALTER TABLE "public"."user" DROP COLUMN "username";

ALTER TABLE ONLY "public"."Chat" ALTER COLUMN "lastMessageIndex" SET DEFAULT nextval('"Chat_lastMessageIndex_seq"'::regclass);

ALTER TABLE "public"."Chat" DROP COLUMN "lastMessageIndex";

ALTER TABLE "public"."Chat" ADD COLUMN "lastMessageIndex" int4;
ALTER TABLE "public"."Chat" ALTER COLUMN "lastMessageIndex" DROP NOT NULL;

DROP TABLE "public"."ChatReaction";

DROP TABLE "public"."FlaggedChatMessage";

DROP TABLE "public"."ChatMessage";

alter table "public"."ChatTyper" add constraint "ChatTyper_id_key" unique ("id");

DROP TABLE "public"."ChatMember";

ALTER TABLE "public"."ChatModerator" DROP COLUMN "createdAt";

ALTER TABLE "public"."ChatViewer" DROP COLUMN "lastSeen";

ALTER TABLE "public"."ChatTyper" DROP COLUMN "updatedAt";

DROP TABLE "public"."ChatModerator";

alter table "public"."ChatTyper" drop constraint "ChatTyper_chatId_userId_key";

alter table "public"."ChatTyper" drop constraint "ChatTyper_id_key";

DROP TABLE "public"."ChatViewer";

alter table "public"."ChatTyper" rename to "ChatTypers";

DROP TABLE "public"."ChatTypers";

alter table "public"."Chat" rename column "creatorId" to "creator";

DROP TABLE "public"."Chat";

DROP TABLE "public"."OnlineStatus";

ALTER TABLE ONLY "public"."user" ALTER COLUMN "lastLoggedInAt" DROP DEFAULT;

ALTER TABLE "public"."user" DROP COLUMN "lastLoggedInAt";

ALTER TABLE "public"."user" DROP COLUMN "lastName";

ALTER TABLE "public"."user" DROP COLUMN "firstName";

DROP TRIGGER IF EXISTS "set_public_user_updated_at" ON "public"."user";
ALTER TABLE "public"."user" DROP COLUMN "updated_at";

ALTER TABLE "public"."user" DROP COLUMN "created_at";

DROP TABLE "public"."user";
