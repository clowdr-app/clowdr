CREATE OR REPLACE FUNCTION public.requireditem_content_group_title(requireditem_row "RequiredContentItem")
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT "title" FROM "ContentGroup" WHERE id = requireditem_row."contentGroupId" LIMIT 1
$function$;
