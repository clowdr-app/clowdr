ALTER TABLE "public"."RolePermission" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
