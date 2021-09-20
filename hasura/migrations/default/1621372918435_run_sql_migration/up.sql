CREATE MATERIALIZED VIEW "analytics"."mat_RoomPresence" AS 
 SELECT room.id,
    room.name,
    stats.created_at,
    (stats.pages -> ('PresenceList:'::text || encode(digest(((((conf.slug || '/conference/'::text) || conf.slug) || '/room/'::text) || room.id), 'sha256'::text), 'hex'::text))) AS count
   FROM ((room."Room" room
     JOIN conference."Conference" conf ON ((conf.id = room."conferenceId")))
     JOIN analytics."AppStats" stats ON ((stats.pages ? ('PresenceList:'::text || encode(digest(((((conf.slug || '/conference/'::text) || conf.slug) || '/room/'::text) || room.id), 'sha256'::text), 'hex'::text)))));

CREATE OR REPLACE VIEW "analytics"."RoomPresence" AS 
    SELECT * FROM "analytics"."mat_RoomPresence";
