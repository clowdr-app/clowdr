alter table "public"."TranscriptionJob" drop constraint "TranscriptionJob_contentItemId_fkey",
             add constraint "TranscriptionJob_contentItemId_fkey"
             foreign key ("contentItemId")
             references "public"."ContentItem"
             ("id") on update cascade on delete cascade;
