CREATE INDEX "registrant_Registrant_displayName_gin" ON "registrant"."Registrant"
USING GIN (("displayName") gin_trgm_ops);

CREATE INDEX "registrant_Profile_affiliation_gin" ON "registrant"."Profile"
USING GIN (("affiliation") gin_trgm_ops);
