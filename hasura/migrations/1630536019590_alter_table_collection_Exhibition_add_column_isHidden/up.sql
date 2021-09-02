alter table "collection"."Exhibition" add column IF NOT EXISTS "isHidden" boolean
 not null default 'false';
