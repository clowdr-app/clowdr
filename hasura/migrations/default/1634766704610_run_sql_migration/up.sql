CREATE OR REPLACE VIEW "room"."LivestreamDurations" AS 
 SELECT "Event"."conferenceId",
    "Event"."roomId",
    sum("Event"."durationSeconds") AS sum,
    "Event"."subconferenceId"
   FROM schedule."Event"
  WHERE ("Event"."intendedRoomModeName" = ANY ('{PRERECORDED,PRESENTATION,Q_AND_A}'::text[]))
  GROUP BY "Event"."conferenceId", "Event"."subconferenceId", "Event"."roomId";
