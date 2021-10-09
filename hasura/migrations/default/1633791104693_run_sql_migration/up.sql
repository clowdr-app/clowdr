CREATE OR REPLACE FUNCTION "video"."VonageParticipantStream_durationSeconds"(participant_row "video"."VonageParticipantStream")
RETURNS bigint AS $$
  SELECT ROUND(EXTRACT(EPOCH FROM (participant_row."stopped_at" - participant_row."created_at"))) :: bigint
$$ LANGUAGE sql STABLE;
