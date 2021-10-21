CREATE  INDEX "schedule_Event_EventsInRange" on
  "schedule"."Event" using btree ("endTime", "intendedRoomModeName", "startTime");
