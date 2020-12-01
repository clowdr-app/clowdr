alter table "public"."RequiredContentItem" add foreign key ("originatingDataId") references "public"."OriginatingData"("id") on update cascade on delete restrict;
