CREATE INDEX "content_ElementPermissionGrant_permissionSetId" on "content"."ElementPermissionGrant"("permissionSetId");
CREATE INDEX "content_ElementPermissionGrant_conferenceSlug" on "content"."ElementPermissionGrant"("conferenceSlug");
CREATE INDEX "content_ElementPermissionGrant_groupId" on "content"."ElementPermissionGrant"("groupId");
CREATE INDEX "content_ElementPermissionGrant_entityId" on "content"."ElementPermissionGrant"("entityId");

CREATE INDEX "content_UploadableElementPermissionGrant_permissionSetId" on "content"."UploadableElementPermissionGrant"("permissionSetId");
CREATE INDEX "content_UploadableElementPermissionGrant_conferenceSlug" on "content"."UploadableElementPermissionGrant"("conferenceSlug");
CREATE INDEX "content_UploadableElementPermissionGrant_groupId" on "content"."UploadableElementPermissionGrant"("groupId");
CREATE INDEX "content_UploadableElementPermissionGrant_entityId" on "content"."UploadableElementPermissionGrant"("entityId");
