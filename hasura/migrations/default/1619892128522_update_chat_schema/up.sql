ALTER FUNCTION "chat"."lowercase_invited_email_address"
    RENAME TO "lowercaseInvitedEmailAddress";
ALTER FUNCTION "chat"."lowercaseInvitedEmailAddress"
    SET SCHEMA "registrant";
    
ALTER FUNCTION "chat"."lowercase_uploader_email_address"
    RENAME TO "lowercaseUploaderEmailAddress";
ALTER FUNCTION "chat"."lowercaseUploaderEmailAddress"
    SET SCHEMA "content";
    
ALTER FUNCTION "chat"."lowercase_user_email_address"
    RENAME TO "lowercaseUserEmailAddress";
ALTER FUNCTION "chat"."lowercaseUserEmailAddress"
    SET SCHEMA "public";


ALTER TABLE "chat"."Pin"
    RENAME CONSTRAINT "Pin_attendeeId_fkey" to "Pin_registrantId_fkey";
ALTER TABLE "chat"."ReadUpToIndex"
    RENAME CONSTRAINT "ReadUpToIndex_attendeeId_fkey" to "ReadUpToIndex_registrantId_fkey";
ALTER TABLE "chat"."Subscription"
    RENAME CONSTRAINT "Subscription_attendeeId_fkey" to "Subscription_registrantId_fkey";

CREATE INDEX "chat_Reaction_chatId" ON "chat"."Reaction" ("chatId");
CREATE INDEX "chat_Reaction_messageSId" ON "chat"."Reaction" ("messageSId");
CREATE INDEX "chat_Reaction_duplicateSId" ON "chat"."Reaction" ("duplicateSId");
