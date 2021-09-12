CREATE INDEX "schedule_Event_name_gin" ON "schedule"."Event"
USING GIN (("name") gin_trgm_ops);
