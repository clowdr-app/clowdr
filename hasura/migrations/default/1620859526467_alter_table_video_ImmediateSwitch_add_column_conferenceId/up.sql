TRUNCATE "video"."ImmediateSwitch";

alter table
    "video"."ImmediateSwitch"
add
    column "conferenceId" uuid not null;