alter table "analytics"."ContentItemStats" drop constraint "ContentItemStats_pkey";
alter table "analytics"."ContentItemStats"
    add constraint "ContentGroupStats_pkey" 
    primary key ( "itemId" );
