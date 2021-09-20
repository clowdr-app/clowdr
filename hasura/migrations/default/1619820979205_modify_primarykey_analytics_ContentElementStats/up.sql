alter table "analytics"."ContentElementStats" drop constraint "ContentItemStats_pkey";
alter table "analytics"."ContentElementStats"
    add constraint "ContentElementStats_pkey" 
    primary key ( "id" );
