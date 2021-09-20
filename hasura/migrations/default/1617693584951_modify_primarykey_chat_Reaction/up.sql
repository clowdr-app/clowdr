alter table "chat"."Reaction" drop constraint "Reaction_pkey";
alter table "chat"."Reaction"
    add constraint "Reaction_pkey" 
    primary key ( "sId" );
