alter table "analytics"."ContentElementStats" drop constraint "ContentElementStats_pkey";
alter table "analytics"."ContentElementStats"
    add constraint "ContentItemStats_pkey" 
    primary key ( "itemId" );
