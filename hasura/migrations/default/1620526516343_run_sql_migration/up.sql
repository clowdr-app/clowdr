CREATE OR REPLACE FUNCTION "content"."hasBeenUploaded"(i_row "content"."UploadableElement")
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT EXISTS (SELECT 1 FROM "content"."Element" WHERE "content"."Element"."uploadableId" = i_row."id")
$function$;
