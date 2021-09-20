CREATE OR REPLACE FUNCTION "content"."UploadableElement_itemTitle"(i_row "content"."UploadableElement")
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT "title" FROM "content"."Item" WHERE id = i_row."itemId" LIMIT 1
$function$;
