ALTER TABLE ONLY "public"."Chat" ALTER COLUMN "lastMessageIndex" SET DEFAULT nextval('"Chat_lastMessageIndex_seq"'::regclass);
