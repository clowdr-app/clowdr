ALTER TABLE ONLY "public"."Invitation" ALTER COLUMN "confirmationCode" SET DEFAULT gen_random_uuid();
