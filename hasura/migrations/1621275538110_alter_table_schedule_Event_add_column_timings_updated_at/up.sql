alter table
    "schedule"."Event"
add
    column "timings_updated_at" timestamptz null;

UPDATE
    "schedule"."Event"
SET
    timings_updated_at = updated_at;

ALTER TABLE
    "schedule"."Event"
ALTER COLUMN
    timings_updated_at
SET
    NOT NULL;