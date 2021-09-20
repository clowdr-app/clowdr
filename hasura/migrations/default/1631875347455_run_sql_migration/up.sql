CREATE FUNCTION "content"."elementHasBeenSubmitted"(el_row "content"."Element")
RETURNS BOOLEAN AS $$
BEGIN
   IF jsonb_typeof(el_row.data) = 'array' THEN
    RETURN jsonb_array_length(el_row.data) > 0;
   ELSE
    RETURN FALSE;
   END IF;
END
$$ LANGUAGE plpgsql STABLE;
