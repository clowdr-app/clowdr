alter table "chat"."Typer"
           add constraint "Typer_messageTypeName_fkey"
           foreign key ("messageTypeName")
           references "chat"."MessageType"
           ("name") on update cascade on delete restrict;
