alter table "public"."Conference" add constraint "Slug does not contain forward-slash" check (NOT (slug LIKE '%/%'));
