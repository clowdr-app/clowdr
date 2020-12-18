alter table "public"."TranscriptionJob"
           add constraint "TranscriptionJob_contentItemId_fkey"
           foreign key ("contentItemId")
           references "public"."ContentItem"
           ("id") on update restrict on delete restrict;
