ALTER TABLE "content"."ElementPermissionGrant" ADD COLUMN "includeUnauthenticated" bool;
ALTER TABLE "content"."ElementPermissionGrant" ALTER COLUMN "includeUnauthenticated" DROP NOT NULL;
ALTER TABLE "content"."ElementPermissionGrant" ALTER COLUMN "includeUnauthenticated" SET DEFAULT false;
