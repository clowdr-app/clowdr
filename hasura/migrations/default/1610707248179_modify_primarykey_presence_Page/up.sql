alter table "presence"."Page"
    add constraint "Page_pkey" 
    primary key ( "path", "conferenceId" );
