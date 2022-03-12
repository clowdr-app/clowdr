CREATE  INDEX "schedule_Event_endTime_asc" on
  "schedule"."Event" using btree ("scheduledEndTime");
