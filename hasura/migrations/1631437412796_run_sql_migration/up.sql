CREATE INDEX "collection_Tag_name_gin" ON "collection"."Tag"
USING GIN ((name) gin_trgm_ops);

CREATE INDEX "collection_Exhibition_name_gin" ON "collection"."Exhibition"
USING GIN ((name) gin_trgm_ops);

CREATE INDEX "content_Item_title_gin" ON "content"."Item"
USING GIN ((title) gin_trgm_ops);
