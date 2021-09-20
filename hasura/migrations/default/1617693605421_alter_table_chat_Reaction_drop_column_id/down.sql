ALTER TABLE "chat"."Reaction" ADD COLUMN "id" int4;
ALTER TABLE "chat"."Reaction" ALTER COLUMN "id" DROP NOT NULL;
ALTER TABLE "chat"."Reaction" ALTER COLUMN "id" SET DEFAULT nextval('chat."Reaction_id_seq"'::regclass);
