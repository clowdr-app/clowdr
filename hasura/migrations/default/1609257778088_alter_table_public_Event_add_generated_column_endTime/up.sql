ALTER TABLE public."Event" ADD COLUMN "endTime" timestamp with time zone GENERATED ALWAYS AS (("startTime" AT TIME ZONE 'UTC' + "durationSeconds" * interval '1 second') AT TIME ZONE 'UTC') STORED;
