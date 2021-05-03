CREATE OR REPLACE VIEW "registrant"."RegistrantProfileBadges" AS 
 SELECT "RegistrantProfile"."registrantId" AS "registrantId",
    (jsonb_array_elements.value ->> 'name'::text) AS name,
    (jsonb_array_elements.value ->> 'colour'::text) AS colour
   FROM (registrant."RegistrantProfile"
     CROSS JOIN LATERAL jsonb_array_elements("RegistrantProfile".badges) jsonb_array_elements(value));
