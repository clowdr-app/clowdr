DROP FUNCTION IF EXISTS public.requireditem_content_group_title;

CREATE OR REPLACE FUNCTION "public"."ContentUploadableElement_Item_Title"(thisRow "ContentUploadableElement")
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT "title" FROM "ContentItem" WHERE id = thisRow."itemId" LIMIT 1
$function$;
