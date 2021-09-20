CREATE INDEX IF NOT EXISTS presence_page_path ON "presence"."Page" ("path");
CREATE INDEX IF NOT EXISTS presence_page_conferenceId ON "presence"."Page" ("conferenceId");

CREATE INDEX IF NOT EXISTS presence_opentab_path ON "presence"."OpenTab" ("path");
CREATE INDEX IF NOT EXISTS presence_opentab_attendeeId ON "presence"."OpenTab" ("attendeeId");
