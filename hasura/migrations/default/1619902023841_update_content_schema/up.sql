ALTER TABLE "content"."Element"
    RENAME CONSTRAINT "ContentItem_conferenceId_fkey" to "Element_conferenceId_fkey";
ALTER TABLE "content"."Element"
    RENAME CONSTRAINT "ContentItem_contentGroupId_fkey" to "Element_itemId_fkey";
ALTER TABLE "content"."Element"
    RENAME CONSTRAINT "ContentItem_contentTypeName_fkey" to "Element_typeName_fkey";
ALTER TABLE "content"."Element"
    RENAME CONSTRAINT "ContentItem_originatingDataId_fkey" to "Element_originatingDataId_fkey";
ALTER TABLE "content"."Element"
    RENAME CONSTRAINT "ContentItem_pkey" to "Element_pkey";
ALTER TABLE "content"."Element"
    RENAME CONSTRAINT "ContentItem_requiredContentId_fkey" to "Element_requiredContentId_fkey";
ALTER TABLE "content"."Element"
    RENAME CONSTRAINT "ContentItem_requiredContentId_key" to "Element_requiredContentId_key";

ALTER INDEX "content"."contentitem_group_id" RENAME TO "content_Element_itemId";
CREATE INDEX "content_Element_typeName" ON "content"."Element" ("typeName");
CREATE INDEX "content_Element_uploadableId" ON "content"."Element" ("uploadableId");
CREATE INDEX "content_Element_conferenceId" ON "content"."Element" ("conferenceId");

ALTER TRIGGER "set_public_ContentItem_updated_at" ON "content"."Element"
    RENAME TO "set_content_Element_updated_at";


ALTER TABLE "content"."ElementType"
    RENAME CONSTRAINT "ContentType_pkey" to "ElementType_pkey";


ALTER TABLE "content"."Item"
    RENAME CONSTRAINT "ContentGroup_chatId_fkey" to "Item_chatId_fkey";
ALTER TABLE "content"."Item"
    RENAME CONSTRAINT "ContentGroup_conferenceId_fkey" to "Item_conferenceId_fkey";
ALTER TABLE "content"."Item"
    RENAME CONSTRAINT "ContentGroup_contentGroupType_fkey" to "Item_typeName_fkey";
ALTER TABLE "content"."Item"
    RENAME CONSTRAINT "ContentGroup_originatingDataId_fkey" to "Item_originatingDataId_fkey";
ALTER TABLE "content"."Item"
    RENAME CONSTRAINT "ContentGroup_pkey" to "Item_pkey";

ALTER INDEX "content"."contentgrouo_type_name" RENAME TO "content_Item_typeName";
ALTER INDEX "content"."contentgroup_chat_id" RENAME TO "content_Item_chatId";
ALTER INDEX "content"."contentgroup_conference_id" RENAME TO "content_Item_conferenceId";
DROP INDEX "content"."type_name";

ALTER TRIGGER "set_public_ContentGroup_updated_at" ON "content"."Item"
    RENAME TO "set_content_Item_updated_at";


ALTER TABLE "content"."ItemExhibition"
    RENAME CONSTRAINT "ContentGroupHallway_conferenceId_fkey" to "ItemExhibition_conferenceId_fkey";
ALTER TABLE "content"."ItemExhibition"
    RENAME CONSTRAINT "ContentGroupHallway_groupId_fkey" to "ItemExhibition_itemId_fkey";
ALTER TABLE "content"."ItemExhibition"
    RENAME CONSTRAINT "ContentGroupHallway_hallwayId_fkey" to "ItemExhibition_exhibitionId_fkey";
ALTER TABLE "content"."ItemExhibition"
    RENAME CONSTRAINT "ContentGroupHallway_pkey" to "ItemExhibition_pkey";

ALTER INDEX "content"."contentgrouphallway_group_id" RENAME TO "content_ItemExhibition_itemId";
CREATE INDEX "content_ItemExhibition_exhibitionId" ON "content"."ItemExhibition" ("exhibitionId");
CREATE INDEX "content_ItemExhibition_conferenceId" ON "content"."ItemExhibition" ("conferenceId");


ALTER TABLE "content"."ItemProgramPerson"
    RENAME CONSTRAINT "ContentItemPerson_conferenceId_fkey" to "ItemProgramPerson_conferenceId_fkey";
ALTER TABLE "content"."ItemProgramPerson"
    RENAME CONSTRAINT "ContentItemPerson_groupId_fkey" to "ItemProgramPerson_itemId_fkey";
ALTER TABLE "content"."ItemProgramPerson"
    RENAME CONSTRAINT "ContentItemPerson_personId_fkey" to "ItemProgramPerson_personId_fkey";
ALTER TABLE "content"."ItemProgramPerson"
    RENAME CONSTRAINT "ContentItemPerson_pkey" to "ItemProgramPerson_pkey";
ALTER TABLE "content"."ItemProgramPerson"
    RENAME CONSTRAINT "ContentItemPerson_roleName_personId_groupId_key" to "ItemProgramPerson_roleName_personId_itemId_key";

ALTER INDEX "content"."contentgroupperson_group_id" RENAME TO "content_ItemProgramPerson_itemId";
CREATE INDEX "content_ItemProgramPerson_personId" ON "content"."ItemProgramPerson" ("personId");
CREATE INDEX "content_ItemProgramPerson_conferenceId" ON "content"."ItemProgramPerson" ("conferenceId");


ALTER TABLE "content"."ItemTag"
    RENAME CONSTRAINT "ContentGroupTag_contentGroupId_fkey" to "ItemTag_itemId_fkey";
ALTER TABLE "content"."ItemTag"
    RENAME CONSTRAINT "ContentGroupTag_contentGroupId_tagId_key" to "ItemTag_itemId_tagId_key";
ALTER TABLE "content"."ItemTag"
    RENAME CONSTRAINT "ContentGroupTag_pkey" to "ItemTag_pkey";
ALTER TABLE "content"."ItemTag"
    RENAME CONSTRAINT "ContentGroupTag_tagId_fkey" to "ItemTag_tagId_fkey";

ALTER INDEX "content"."contentgrouptag_group_id" RENAME TO "content_ItemTag_itemId";
ALTER INDEX "content"."contentgrouptag_tag_id" RENAME TO "content_ItemTag_tagId";
DROP INDEX "content"."tag_id";


ALTER TABLE "content"."ItemType"
    RENAME CONSTRAINT "ContentGroupType_pkey" to "ItemType_pkey";


ALTER TABLE "content"."UploadableElement"
    RENAME CONSTRAINT "RequiredContentItem_conferenceId_fkey" to "UploadableElement_conferenceId_fkey";
ALTER TABLE "content"."UploadableElement"
    RENAME CONSTRAINT "RequiredContentItem_contentGroupId_fkey" to "UploadableElement_itemId_fkey";
ALTER TABLE "content"."UploadableElement"
    RENAME CONSTRAINT "RequiredContentItem_contentTypeName_fkey" to "UploadableElement_typeName_fkey";
ALTER TABLE "content"."UploadableElement"
    RENAME CONSTRAINT "RequiredContentItem_originatingDataId_fkey" to "UploadableElement_originatingDataId_fkey";
ALTER TABLE "content"."UploadableElement"
    RENAME CONSTRAINT "RequiredContentItem_pkey" to "UploadableElement_pkey";

CREATE INDEX "content_UploadableElement_itemId" ON "content"."UploadableElement" ("itemId");
CREATE INDEX "content_UploadableElement_accessToken" ON "content"."UploadableElement" ("accessToken");
CREATE INDEX "content_UploadableElement_conferenceId" ON "content"."UploadableElement" ("conferenceId");

ALTER TRIGGER "set_public_RequiredContentItem_updated_at" ON "content"."UploadableElement"
    RENAME TO "set_content_UploadableElement_updated_at";


ALTER TABLE "content"."Uploader"
    RENAME CONSTRAINT "Uploader_email_requiredContentItemId_key" to "Uploader_email_uploadableElementId_key";
ALTER TABLE "content"."Uploader"
    RENAME CONSTRAINT "Uploader_requiredContentItemId_fkey" to "Uploader_uploadableElementId_fkey";

CREATE INDEX "content_Uploader_uploadableElementId" ON "content"."Uploader" ("uploadableElementId");
CREATE INDEX "content_Uploader_conferenceId" ON "content"."Uploader" ("conferenceId");

ALTER TRIGGER "set_public_Uploader_updated_at" ON "content"."Uploader"
    RENAME TO "set_content_Uploader_updated_at";
