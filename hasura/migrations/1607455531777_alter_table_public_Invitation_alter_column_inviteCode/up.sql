ALTER TABLE ONLY "public"."Invitation" ALTER COLUMN "inviteCode" SET DEFAULT gen_random_uuid();
