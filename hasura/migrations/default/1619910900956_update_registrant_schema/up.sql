ALTER TABLE "registrant"."Invitation"
    RENAME CONSTRAINT "Inivitation_attendeeId_fkey" to "Invitation_registrantId_fkey";
ALTER TABLE "registrant"."Invitation"
    RENAME CONSTRAINT "Inivitation_linkToUserId_fkey" to "Invitation_linkToUserId_fkey";
ALTER TABLE "registrant"."Invitation"
    RENAME CONSTRAINT "Inivitation_pkey" to "Invitation_pkey";
ALTER TABLE "registrant"."Invitation"
    RENAME CONSTRAINT "Inivitation_attendeeId_key" to "Invitation_registrantId_key";
ALTER TABLE "registrant"."Invitation"
    RENAME CONSTRAINT "Inivitation_confirmationCode_key" to "Invitation_confirmationCode_key";
ALTER TABLE "registrant"."Invitation"
    RENAME CONSTRAINT "Inivitation_inviteCode_key" to "Invitation_inviteCode_key";

ALTER INDEX "registrant"."invitation_event_id" RENAME TO "registrant_Invitation_inviteCode";
CREATE INDEX "registrant_Invitation_registrantId" ON "registrant"."Invitation" ("registrantId");
CREATE INDEX "registrant_Invitation_conferenceId" ON "registrant"."Invitation" ("conferenceId");

ALTER TRIGGER "lowercase_email" ON "registrant"."Invitation"
    RENAME TO "lowercaseEmail";
ALTER TRIGGER "set_conference_id" ON "registrant"."Invitation"
    RENAME TO "setConferenceId";
ALTER TRIGGER "set_public_Inivitation_updated_at" ON "registrant"."Invitation"
    RENAME TO "set_registrant_Inivitation_updated_at";


ALTER TABLE "registrant"."Registrant"
    RENAME CONSTRAINT "Attendee_conferenceId_fkey" to "Registrant_conferenceId_fkey";
ALTER TABLE "registrant"."Registrant"
    RENAME CONSTRAINT "Attendee_userId_fkey" to "Registrant_userId_fkey";
ALTER TABLE "registrant"."Registrant"
    RENAME CONSTRAINT "Attendee_pkey" to "Registrant_pkey";
ALTER TABLE "registrant"."Registrant"
    RENAME CONSTRAINT "Attendee_conferenceId_userId_key" to "Registrant_conferenceId_userId_key";

ALTER INDEX "registrant"."attendee_conference_id" RENAME TO "registrant_Registrant_conferenceId";
ALTER INDEX "registrant"."attendee_user_id" RENAME TO "registrant_Registrant_userId";
DROP INDEX "registrant"."user_id";

ALTER TRIGGER "set_public_Attendee_updated_at" ON "registrant"."Registrant"
    RENAME TO "set_public_Registrant_updated_at";
ALTER TRIGGER "trigger_insert_attendee" ON "registrant"."Registrant"
    RENAME TO "createAttendeeProfile";


ALTER TABLE "registrant"."GoogleAccount"
    RENAME CONSTRAINT "AttendeeGoogleAccount_attendeeId_fkey" to "GoogleAccount_registrantId_fkey";
ALTER TABLE "registrant"."GoogleAccount"
    RENAME CONSTRAINT "AttendeeGoogleAccount_conferenceId_fkey" to "GoogleAccount_conferenceId_fkey";
ALTER TABLE "registrant"."GoogleAccount"
    RENAME CONSTRAINT "AttendeeGoogleAccount_pkey" to "GoogleAccount_pkey";
ALTER TABLE "registrant"."GoogleAccount"
    RENAME CONSTRAINT "AttendeeGoogleAccount_attendeeId_googleAccountEmail_key"
    to "GoogleAccount_registrantId_googleAccountEmail_key";

ALTER TRIGGER "set_public_AttendeeGoogleAccount_updated_at" ON "registrant"."GoogleAccount"
    RENAME TO "set_registrant_GoogleAccount_updated_at";

CREATE INDEX "registrant_GoogleAccount_registrantId" ON "registrant"."GoogleAccount" ("registrantId");
CREATE INDEX "registrant_GoogleAccount_conferenceId" ON "registrant"."GoogleAccount" ("conferenceId");


ALTER TABLE "registrant"."Profile"
    RENAME CONSTRAINT "AttendeeProfile_attendeeId_fkey" to "Profile_registrantId_fkey";
ALTER TABLE "registrant"."Profile"
    RENAME CONSTRAINT "AttendeeProfile_pkey" to "Profile_pkey";
ALTER TABLE "registrant"."Profile"
    RENAME CONSTRAINT "AttendeeProfile_attendeeId_key" to "Profile_registrantId_key";

ALTER TRIGGER "set_public_AttendeeProfile_updated_at" ON "registrant"."Profile"
    RENAME TO "set_registrant_Profile_updated_at";
