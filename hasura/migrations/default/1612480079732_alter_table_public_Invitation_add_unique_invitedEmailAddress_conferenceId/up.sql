alter table "public"."Invitation" add constraint "Invitation_invitedEmailAddress_conferenceId_key" unique ("invitedEmailAddress", "conferenceId");
