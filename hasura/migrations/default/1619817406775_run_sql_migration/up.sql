CREATE OR REPLACE FUNCTION public.requireditem_content_group_title(requireditem_row "ContentUploadableElement")
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT "title" FROM "ContentItem" WHERE id = requireditem_row."itemId" LIMIT 1
$function$;
