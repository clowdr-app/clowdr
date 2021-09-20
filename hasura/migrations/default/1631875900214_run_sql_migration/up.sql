CREATE FUNCTION "content"."itemHasUnsubmittedElements"(item_row "content"."Item")
RETURNS BOOLEAN AS $$
    SELECT 0 < (
        SELECT COUNT(*) FROM "content"."Element" AS element 
        WHERE element."itemId" = item_row.id
        AND NOT content."elementHasBeenSubmitted"(element)
    )
$$ LANGUAGE sql STABLE;
