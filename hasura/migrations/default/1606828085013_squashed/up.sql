
CREATE TABLE "public"."user"("id" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"));

ALTER TABLE "public"."user" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();

ALTER TABLE "public"."user" ADD COLUMN "updated_at" timestamptz NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_user_updated_at"
BEFORE UPDATE ON "public"."user"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_user_updated_at" ON "public"."user" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."user" ADD COLUMN "firstName" text NOT NULL;

ALTER TABLE "public"."user" ADD COLUMN "lastName" text NOT NULL;

ALTER TABLE "public"."user" ADD COLUMN "lastLoggedInAt" timestamptz NULL;

ALTER TABLE ONLY "public"."user" ALTER COLUMN "lastLoggedInAt" SET DEFAULT now();

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."OnlineStatus"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" text NOT NULL, "lastSeen" timestamptz NOT NULL DEFAULT now(), "isIncognito" boolean NOT NULL DEFAULT false, PRIMARY KEY ("id") , FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("userId"));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Chat"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "description" text, "mode" text NOT NULL, "isAutoPin" boolean NOT NULL DEFAULT false, "isAutoNotify" boolean NOT NULL DEFAULT false, "lastMessageIndex" integer, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), "creator" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("creator") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE restrict, UNIQUE ("id"));

alter table "public"."Chat" rename column "creator" to "creatorId";

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatTypers"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"));

alter table "public"."ChatTypers" rename to "ChatTyper";

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatViewer"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("chatId", "userId"));

alter table "public"."ChatTyper" add constraint "ChatTyper_id_key" unique ("id");

alter table "public"."ChatTyper" add constraint "ChatTyper_chatId_userId_key" unique ("chatId", "userId");

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatModerator"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("chatId", "userId"));

ALTER TABLE "public"."ChatTyper" ADD COLUMN "updatedAt" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."ChatViewer" ADD COLUMN "lastSeen" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."ChatModerator" ADD COLUMN "createdAt" timestamptz NOT NULL DEFAULT now();

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatMember"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), "invitationAcceptedAt" timestamptz, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("chatId", "userId"));

alter table "public"."ChatTyper" drop constraint "ChatTyper_id_key";

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatMessage"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "senderId" text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), "content" jsonb NOT NULL, "index" integer NOT NULL, "isHighlighted" boolean NOT NULL DEFAULT false, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("chatId", "index"));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."FlaggedChatMessage"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "messageId" uuid NOT NULL, "flaggedById" text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "resolvedAt" timestamptz, "resolutionAction" text, "notes" text, "moderationChatId" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("messageId") REFERENCES "public"."ChatMessage"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("flaggedById") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("moderationChatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("id"), UNIQUE ("messageId", "flaggedById"));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatReaction"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "messageId" uuid NOT NULL, "reactorId" text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "reaction" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("messageId") REFERENCES "public"."ChatMessage"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("reactorId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("messageId", "reactorId", "reaction"));

ALTER TABLE "public"."Chat" DROP COLUMN "lastMessageIndex" CASCADE;

ALTER TABLE "public"."Chat" ADD COLUMN "lastMessageIndex" serial NOT NULL;

ALTER TABLE ONLY "public"."Chat" ALTER COLUMN "lastMessageIndex" SET DEFAULT 0;

ALTER TABLE "public"."user" ADD COLUMN "username" text NULL;

ALTER TABLE "public"."user" ADD COLUMN "email" text NULL;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatUnreadIndex"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, "index" integer, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("chatId", "userId"));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."PinnedChat"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, "manual" boolean NOT NULL DEFAULT true, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("chatId", "userId"));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."FollowedChat"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, "manual" boolean NOT NULL DEFAULT false, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("chatId", "userId"));

ALTER TABLE "public"."Chat" DROP COLUMN "lastMessageIndex" CASCADE;

ALTER TABLE "public"."user" ADD COLUMN "status" text NOT NULL DEFAULT 'active';

alter table "public"."user" add constraint "user_email_key" unique ("email");

ALTER TABLE "public"."user" DROP COLUMN "username" CASCADE;

alter table "public"."user" rename to "User";

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Conference"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "shortName" Text NOT NULL, "slug" text NOT NULL, "createdBy" text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON UPDATE cascade ON DELETE restrict, UNIQUE ("id"), UNIQUE ("name"), UNIQUE ("shortName"), UNIQUE ("slug"));

ALTER TABLE "public"."User" DROP COLUMN "status" CASCADE;

CREATE TABLE "public"."Permission"("name" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("name") , UNIQUE ("name"));

INSERT INTO "Permission" (name, description) VALUES
  ('CONFERENCE_MANAGE_NAME', 'Manage (update only) conference name, short name and slug.'),
  ('CONFERENCE_MANAGE_ATTENDEES', 'Manage (create/update/delete) conference attendees.'),
  ('CONFERENCE_MODERATE_ATTENDEES', 'Moderate (update only) conference attendees.'),
  ('CONFERENCE_VIEW_ATTENDEES', 'View conference attendees.'),
  ('CONFERENCE_VIEW', 'View the conference.');

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Role"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "conference" uuid NOT NULL, "name" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("conference", "name"));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."RolePermission"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "roleId" uuid NOT NULL, "permission" Text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("permission") REFERENCES "public"."Permission"("name") ON UPDATE cascade ON DELETE restrict, UNIQUE ("id"), UNIQUE ("roleId", "permission"));

alter table "public"."Role" rename column "conference" to "conferenceId";

alter table "public"."Role"
           add constraint "Role_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;

alter table "public"."RolePermission"
           add constraint "RolePermission_roleId_fkey"
           foreign key ("roleId")
           references "public"."Role"
           ("id") on update cascade on delete cascade;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Group"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "conferenceId" uuid NOT NULL, "name" text NOT NULL, "includeUnauthenticated" boolean NOT NULL DEFAULT false, "accessStart" timestamptz NOT NULL, "accessEnd" timestamptz NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("conferenceId", "name"), CONSTRAINT "Access start before end" CHECK ("accessStart" < "accessEnd"));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."GroupRole"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "groupId" uuid NOT NULL, "roleId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("groupId", "roleId"));

INSERT INTO "Permission" (name, description) VALUES
  ('CONFERENCE_MANAGE_ROLES', 'Manage roles of a conference.'),
  ('CONFERENCE_MANAGE_GROUPS', 'Manage groups of a conference.');

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Attendee"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "conferenceId" uuid NOT NULL, "userId" text, "status" text NOT NULL, "displayName" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("id"));

CREATE TABLE "public"."AttendeeStatus"("name" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("name") , UNIQUE ("name"));

INSERT INTO "AttendeeStatus" (name, description) VALUES
  ('ACTIVE', 'Active attendee.'),
  ('BANNED', 'User has been banned from the conference.');

alter table "public"."Attendee"
           add constraint "Attendee_status_fkey"
           foreign key ("status")
           references "public"."AttendeeStatus"
           ("name") on update cascade on delete restrict;

alter table "public"."Attendee" rename column "status" to "statusName";

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."GroupAttendee"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "groupId" uuid NOT NULL, "attendeeId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("groupId", "attendeeId"));

alter table "public"."RolePermission" rename column "permission" to "permissionName";

CREATE VIEW "ActiveGroup" AS
  SELECT g.*
  FROM "Group" g
  WHERE now() BETWEEN g."accessStart" AND g."accessEnd";

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ConferenceDemoCodes"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" timestamptz NOT NULL DEFAULT now(), "validFor" bigint NOT NULL DEFAULT 1209600000, "note" text, PRIMARY KEY ("id") , UNIQUE ("id"), CONSTRAINT "validFor > 0" CHECK ("validFor" > 0));

ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "used" boolean NOT NULL DEFAULT false;

alter table "public"."ConferenceDemoCodes" drop constraint "validFor > 0";

ALTER TABLE "public"."ConferenceDemoCodes" DROP COLUMN "validFor" CASCADE;

ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "validUpTo" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."ConferenceDemoCodes" DROP COLUMN "validUpTo" CASCADE;

ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "updatedAt" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "usedBy" text NULL;

alter table "public"."ConferenceDemoCodes" rename column "usedBy" to "usedById";

alter table "public"."ConferenceDemoCodes"
           add constraint "ConferenceDemoCodes_usedById_fkey"
           foreign key ("usedById")
           references "public"."User"
           ("id") on update cascade on delete cascade;

ALTER TABLE "public"."Conference" ADD COLUMN "demoCodeId" uuid NOT NULL;

alter table "public"."Conference"
           add constraint "Conference_demoCodeId_fkey"
           foreign key ("demoCodeId")
           references "public"."ConferenceDemoCodes"
           ("id") on update cascade on delete restrict;

ALTER TABLE "public"."ConferenceDemoCodes" DROP COLUMN "used" CASCADE;

alter table "public"."Conference" add constraint "Conference_demoCodeId_key" unique ("demoCodeId");

alter table "public"."ConferenceDemoCodes" rename to "ConferenceDemoCode";

alter table "public"."Attendee" add constraint "Attendee_conferenceId_userId_key" unique ("conferenceId", "userId");

ALTER TABLE "public"."Attendee" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."Attendee" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_Attendee_updated_at"
BEFORE UPDATE ON "public"."Attendee"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Attendee_updated_at" ON "public"."Attendee" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."Conference" DROP COLUMN "createdAt" CASCADE;

ALTER TABLE "public"."Conference" DROP COLUMN "updatedAt" CASCADE;

ALTER TABLE "public"."Conference" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."Conference" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_Conference_updated_at"
BEFORE UPDATE ON "public"."Conference"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Conference_updated_at" ON "public"."Conference" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

alter table "public"."Attendee" rename column "created_at" to "createdAt";

alter table "public"."Attendee" rename column "updated_at" to "updatedAt";

alter table "public"."Attendee" rename column "updatedAt" to "updated_at";

alter table "public"."Attendee" rename column "createdAt" to "created_at";

ALTER TABLE "public"."ConferenceDemoCode" DROP COLUMN "createdAt" CASCADE;

ALTER TABLE "public"."ConferenceDemoCode" DROP COLUMN "updatedAt" CASCADE;

ALTER TABLE "public"."ConferenceDemoCode" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();

ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "created_at" SET NOT NULL;

ALTER TABLE "public"."ConferenceDemoCode" ADD COLUMN "updated_at" timestamptz NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_ConferenceDemoCode_updated_at"
BEFORE UPDATE ON "public"."ConferenceDemoCode"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ConferenceDemoCode_updated_at" ON "public"."ConferenceDemoCode" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."Group" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."Group" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_Group_updated_at"
BEFORE UPDATE ON "public"."Group"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Group_updated_at" ON "public"."Group" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE "public"."GroupAttendee" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."GroupAttendee" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_GroupAttendee_updated_at"
BEFORE UPDATE ON "public"."GroupAttendee"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_GroupAttendee_updated_at" ON "public"."GroupAttendee" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."GroupRole" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."GroupRole" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_GroupRole_updated_at"
BEFORE UPDATE ON "public"."GroupRole"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_GroupRole_updated_at" ON "public"."GroupRole" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."OnlineStatus" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "public"."OnlineStatus" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_OnlineStatus_updated_at"
BEFORE UPDATE ON "public"."OnlineStatus"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_OnlineStatus_updated_at" ON "public"."OnlineStatus" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."Role" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."Role" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_Role_updated_at"
BEFORE UPDATE ON "public"."Role"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Role_updated_at" ON "public"."Role" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."RolePermission" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "public"."RolePermission" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_RolePermission_updated_at"
BEFORE UPDATE ON "public"."RolePermission"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_RolePermission_updated_at" ON "public"."RolePermission" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."User" ALTER COLUMN "created_at" SET NOT NULL;

ALTER TABLE "public"."User" ALTER COLUMN "updated_at" TYPE timestamp with time zone;
ALTER TABLE "public"."User" ALTER COLUMN "updated_at" SET NOT NULL;
