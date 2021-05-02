alter table "analytics"."RoomStats" drop constraint "RoomStats_pkey";
alter table "analytics"."RoomStats"
    add constraint "RoomStats_pkey" 
    primary key ( "id" );
