alter table "public"."AttendeeGoogleAccount" add constraint "AttendeeGoogleAccount_attendeeId_googleAccountEmail_key" unique ("attendeeId", "googleAccountEmail");
