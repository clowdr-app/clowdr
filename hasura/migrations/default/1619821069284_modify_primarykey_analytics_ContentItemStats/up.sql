alter table "analytics"."ContentItemStats" drop constraint "ContentGroupStats_pkey";
alter table "analytics"."ContentItemStats"
    add constraint "ContentItemStats_pkey" 
    primary key ( "id" );
