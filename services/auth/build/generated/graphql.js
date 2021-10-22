"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat_ReactionType_Enum = exports.Chat_ReactionType_Constraint = exports.Chat_Pin_Update_Column = exports.Chat_Pin_Select_Column = exports.Chat_Pin_Constraint = exports.Chat_Message_Update_Column = exports.Chat_Message_Select_Column = exports.Chat_Message_Constraint = exports.Chat_MessageType_Update_Column = exports.Chat_MessageType_Select_Column = exports.Chat_MessageType_Enum = exports.Chat_MessageType_Constraint = exports.Chat_Flag_Update_Column = exports.Chat_Flag_Select_Column = exports.Chat_Flag_Constraint = exports.Chat_FlagType_Update_Column = exports.Chat_FlagType_Select_Column = exports.Chat_FlagType_Enum = exports.Chat_FlagType_Constraint = exports.Chat_Chat_Update_Column = exports.Chat_Chat_Select_Column = exports.Chat_Chat_Constraint = exports.Analytics_Mat_RoomPresence_Select_Column = exports.Analytics_Mat_ItemTotalViews_Select_Column = exports.Analytics_Mat_ElementTotalViews_Select_Column = exports.Analytics_RoomStats_Update_Column = exports.Analytics_RoomStats_Select_Column = exports.Analytics_RoomStats_Constraint = exports.Analytics_RoomPresence_Select_Column = exports.Analytics_ItemTotalViews_Select_Column = exports.Analytics_ElementTotalViews_Select_Column = exports.Analytics_ContentItemStats_Update_Column = exports.Analytics_ContentItemStats_Select_Column = exports.Analytics_ContentItemStats_Constraint = exports.Analytics_ContentElementStats_Update_Column = exports.Analytics_ContentElementStats_Select_Column = exports.Analytics_ContentElementStats_Constraint = exports.Analytics_CompletedRegistrations_Select_Column = exports.Analytics_AppStats_Update_Column = exports.Analytics_AppStats_Select_Column = exports.Analytics_AppStats_Constraint = exports.User_Update_Column = exports.User_Select_Column = exports.User_Constraint = exports.PushNotificationSubscription_Update_Column = exports.PushNotificationSubscription_Select_Column = exports.PushNotificationSubscription_Constraint = exports.Email_Update_Column = exports.Email_Select_Column = exports.Email_Constraint = void 0;
exports.Content_Element_Update_Column = exports.Content_Element_Select_Column = exports.Content_Element_Constraint = exports.Content_ElementType_Update_Column = exports.Content_ElementType_Select_Column = exports.Content_ElementType_Enum = exports.Content_ElementType_Constraint = exports.Conference_VisibilityLevel_Update_Column = exports.Conference_VisibilityLevel_Select_Column = exports.Conference_VisibilityLevel_Enum = exports.Conference_VisibilityLevel_Constraint = exports.Conference_Subconference_Update_Column = exports.Conference_Subconference_Select_Column = exports.Conference_Subconference_Constraint = exports.Conference_OriginatingData_Update_Column = exports.Conference_OriginatingData_Select_Column = exports.Conference_OriginatingData_Constraint = exports.Conference_DemoCode_Update_Column = exports.Conference_DemoCode_Select_Column = exports.Conference_DemoCode_Constraint = exports.Conference_Configuration_Update_Column = exports.Conference_Configuration_Select_Column = exports.Conference_Configuration_Constraint = exports.Conference_ConfigurationKey_Update_Column = exports.Conference_ConfigurationKey_Select_Column = exports.Conference_ConfigurationKey_Enum = exports.Conference_ConfigurationKey_Constraint = exports.Conference_Conference_Update_Column = exports.Conference_Conference_Select_Column = exports.Conference_Conference_Constraint = exports.Collection_Tag_Update_Column = exports.Collection_Tag_Select_Column = exports.Collection_Tag_Constraint = exports.Collection_ProgramPerson_Update_Column = exports.Collection_ProgramPerson_Select_Column = exports.Collection_ProgramPerson_Constraint = exports.Collection_Exhibition_Update_Column = exports.Collection_Exhibition_Select_Column = exports.Collection_Exhibition_Constraint = exports.Chat_Subscription_Update_Column = exports.Chat_Subscription_Select_Column = exports.Chat_Subscription_Constraint = exports.Chat_ReadUpToIndex_Update_Column = exports.Chat_ReadUpToIndex_Select_Column = exports.Chat_ReadUpToIndex_Constraint = exports.Chat_Reaction_Update_Column = exports.Chat_Reaction_Select_Column = exports.Chat_Reaction_Constraint = exports.Chat_ReactionType_Update_Column = exports.Chat_ReactionType_Select_Column = void 0;
exports.Job_Queues_SubmissionRequestEmailJob_Update_Column = exports.Job_Queues_SubmissionRequestEmailJob_Select_Column = exports.Job_Queues_SubmissionRequestEmailJob_Constraint = exports.Job_Queues_PublishVideoJob_Update_Column = exports.Job_Queues_PublishVideoJob_Select_Column = exports.Job_Queues_PublishVideoJob_Constraint = exports.Job_Queues_PrepareJob_Update_Column = exports.Job_Queues_PrepareJob_Select_Column = exports.Job_Queues_PrepareJob_Constraint = exports.Job_Queues_MediaPackageHarvestJob_Update_Column = exports.Job_Queues_MediaPackageHarvestJob_Select_Column = exports.Job_Queues_MediaPackageHarvestJob_Constraint = exports.Job_Queues_JobStatus_Update_Column = exports.Job_Queues_JobStatus_Select_Column = exports.Job_Queues_JobStatus_Enum = exports.Job_Queues_JobStatus_Constraint = exports.Job_Queues_InvitationEmailJob_Update_Column = exports.Job_Queues_InvitationEmailJob_Select_Column = exports.Job_Queues_InvitationEmailJob_Constraint = exports.Job_Queues_CustomEmailJob_Update_Column = exports.Job_Queues_CustomEmailJob_Select_Column = exports.Job_Queues_CustomEmailJob_Constraint = exports.Job_Queues_CombineVideosJob_Update_Column = exports.Job_Queues_CombineVideosJob_Select_Column = exports.Job_Queues_CombineVideosJob_Constraint = exports.Job_Queues_ChannelStackUpdateJob_Update_Column = exports.Job_Queues_ChannelStackUpdateJob_Select_Column = exports.Job_Queues_ChannelStackUpdateJob_Constraint = exports.Job_Queues_ChannelStackDeleteJob_Update_Column = exports.Job_Queues_ChannelStackDeleteJob_Select_Column = exports.Job_Queues_ChannelStackDeleteJob_Constraint = exports.Job_Queues_ChannelStackCreateJob_Update_Column = exports.Job_Queues_ChannelStackCreateJob_Select_Column = exports.Job_Queues_ChannelStackCreateJob_Constraint = exports.Content_Item_Update_Column = exports.Content_Item_Select_Column = exports.Content_Item_Constraint = exports.Content_ItemType_Update_Column = exports.Content_ItemType_Select_Column = exports.Content_ItemType_Enum = exports.Content_ItemType_Constraint = exports.Content_ItemTag_Update_Column = exports.Content_ItemTag_Select_Column = exports.Content_ItemTag_Constraint = exports.Content_ItemProgramPerson_Update_Column = exports.Content_ItemProgramPerson_Select_Column = exports.Content_ItemProgramPerson_Constraint = exports.Content_ItemExhibition_Update_Column = exports.Content_ItemExhibition_Select_Column = exports.Content_ItemExhibition_Constraint = void 0;
exports.Room_PersonRole_Update_Column = exports.Room_PersonRole_Select_Column = exports.Room_PersonRole_Enum = exports.Room_PersonRole_Constraint = exports.Room_Participant_Update_Column = exports.Room_Participant_Select_Column = exports.Room_Participant_Constraint = exports.Room_Mode_Update_Column = exports.Room_Mode_Select_Column = exports.Room_Mode_Enum = exports.Room_Mode_Constraint = exports.Room_ManagementMode_Update_Column = exports.Room_ManagementMode_Select_Column = exports.Room_ManagementMode_Enum = exports.Room_ManagementMode_Constraint = exports.Room_LivestreamDurations_Select_Column = exports.Room_ChimeMeeting_Update_Column = exports.Room_ChimeMeeting_Select_Column = exports.Room_ChimeMeeting_Constraint = exports.Room_Backend_Update_Column = exports.Room_Backend_Select_Column = exports.Room_Backend_Enum = exports.Room_Backend_Constraint = exports.Registrant_SubconferenceMembership_Update_Column = exports.Registrant_SubconferenceMembership_Select_Column = exports.Registrant_SubconferenceMembership_Constraint = exports.Registrant_SavedVonageRoomRecording_Update_Column = exports.Registrant_SavedVonageRoomRecording_Select_Column = exports.Registrant_SavedVonageRoomRecording_Constraint = exports.Registrant_Registrant_Update_Column = exports.Registrant_Registrant_Select_Column = exports.Registrant_Registrant_Constraint = exports.Registrant_RegistrantRole_Update_Column = exports.Registrant_RegistrantRole_Select_Column = exports.Registrant_RegistrantRole_Enum = exports.Registrant_RegistrantRole_Constraint = exports.Registrant_Profile_Update_Column = exports.Registrant_Profile_Select_Column = exports.Registrant_Profile_Constraint = exports.Registrant_ProfileBadges_Select_Column = exports.Registrant_Invitation_Update_Column = exports.Registrant_Invitation_Select_Column = exports.Registrant_Invitation_Constraint = exports.Registrant_GoogleAccount_Update_Column = exports.Registrant_GoogleAccount_Select_Column = exports.Registrant_GoogleAccount_Constraint = exports.Order_By = exports.Job_Queues_UploadYouTubeVideoJob_Update_Column = exports.Job_Queues_UploadYouTubeVideoJob_Select_Column = exports.Job_Queues_UploadYouTubeVideoJob_Constraint = void 0;
exports.Video_ImmediateSwitch_Constraint = exports.Video_EventVonageSession_Update_Column = exports.Video_EventVonageSession_Select_Column = exports.Video_EventVonageSession_Constraint = exports.Video_ChannelStack_Update_Column = exports.Video_ChannelStack_Select_Column = exports.Video_ChannelStack_Constraint = exports.System_Configuration_Update_Column = exports.System_Configuration_Select_Column = exports.System_Configuration_Constraint = exports.System_ConfigurationKey_Update_Column = exports.System_ConfigurationKey_Select_Column = exports.System_ConfigurationKey_Enum = exports.System_ConfigurationKey_Constraint = exports.Schedule_StarredEvent_Update_Column = exports.Schedule_StarredEvent_Select_Column = exports.Schedule_StarredEvent_Constraint = exports.Schedule_OverlappingEvents_Select_Column = exports.Schedule_Event_Update_Column = exports.Schedule_Event_Select_Column = exports.Schedule_Event_Constraint = exports.Schedule_EventProgramPerson_Update_Column = exports.Schedule_EventProgramPerson_Select_Column = exports.Schedule_EventProgramPerson_Constraint = exports.Schedule_EventProgramPersonRole_Update_Column = exports.Schedule_EventProgramPersonRole_Select_Column = exports.Schedule_EventProgramPersonRole_Enum = exports.Schedule_EventProgramPersonRole_Constraint = exports.Schedule_Continuation_Update_Column = exports.Schedule_Continuation_Select_Column = exports.Schedule_Continuation_Constraint = exports.Room_ShuffleRoom_Update_Column = exports.Room_ShuffleRoom_Select_Column = exports.Room_ShuffleRoom_Constraint = exports.Room_ShuffleQueueEntry_Update_Column = exports.Room_ShuffleQueueEntry_Select_Column = exports.Room_ShuffleQueueEntry_Constraint = exports.Room_ShufflePeriod_Update_Column = exports.Room_ShufflePeriod_Select_Column = exports.Room_ShufflePeriod_Constraint = exports.Room_ShuffleAlgorithm_Update_Column = exports.Room_ShuffleAlgorithm_Select_Column = exports.Room_ShuffleAlgorithm_Enum = exports.Room_ShuffleAlgorithm_Constraint = exports.Room_Room_Update_Column = exports.Room_Room_Select_Column = exports.Room_Room_Constraint = exports.Room_RoomMembership_Update_Column = exports.Room_RoomMembership_Select_Column = exports.Room_RoomMembership_Constraint = void 0;
exports.GetUserDocument = exports.GetSubconferenceRoomsDocument = exports.GetSubconferenceDocument = exports.GetRoomMembershipsDocument = exports.GetRoomDocument = exports.GetRegistrantDocument = exports.GetConferenceRoomsDocument = exports.GetConferenceDocument = exports.EmptyQueryDocument = exports.Video_YouTubeUpload_Update_Column = exports.Video_YouTubeUpload_Select_Column = exports.Video_YouTubeUpload_Constraint = exports.Video_VonageSessionLayout_Update_Column = exports.Video_VonageSessionLayout_Select_Column = exports.Video_VonageSessionLayout_Constraint = exports.Video_VonageRoomRecording_Update_Column = exports.Video_VonageRoomRecording_Select_Column = exports.Video_VonageRoomRecording_Constraint = exports.Video_VonageParticipantStream_Update_Column = exports.Video_VonageParticipantStream_Select_Column = exports.Video_VonageParticipantStream_Constraint = exports.Video_VideoRenderJob_Update_Column = exports.Video_VideoRenderJob_Select_Column = exports.Video_VideoRenderJob_Constraint = exports.Video_TranscriptionJob_Update_Column = exports.Video_TranscriptionJob_Select_Column = exports.Video_TranscriptionJob_Constraint = exports.Video_RtmpInput_Update_Column = exports.Video_RtmpInput_Select_Column = exports.Video_RtmpInput_Enum = exports.Video_RtmpInput_Constraint = exports.Video_RoomRtmpOutput_Update_Column = exports.Video_RoomRtmpOutput_Select_Column = exports.Video_RoomRtmpOutput_Constraint = exports.Video_MediaLiveChannelStatus_Update_Column = exports.Video_MediaLiveChannelStatus_Select_Column = exports.Video_MediaLiveChannelStatus_Constraint = exports.Video_InputType_Update_Column = exports.Video_InputType_Select_Column = exports.Video_InputType_Constraint = exports.Video_ImmediateSwitch_Update_Column = exports.Video_ImmediateSwitch_Select_Column = void 0;
var graphql_tag_1 = __importDefault(require("graphql-tag"));
var Email_Constraint;
(function (Email_Constraint) {
    Email_Constraint["EmailPkey"] = "Email_pkey";
})(Email_Constraint = exports.Email_Constraint || (exports.Email_Constraint = {}));
var Email_Select_Column;
(function (Email_Select_Column) {
    Email_Select_Column["CreatedAt"] = "createdAt";
    Email_Select_Column["EmailAddress"] = "emailAddress";
    Email_Select_Column["HtmlContents"] = "htmlContents";
    Email_Select_Column["Id"] = "id";
    Email_Select_Column["InvitationId"] = "invitationId";
    Email_Select_Column["PlainTextContents"] = "plainTextContents";
    Email_Select_Column["Reason"] = "reason";
    Email_Select_Column["RecipientName"] = "recipientName";
    Email_Select_Column["RetriesCount"] = "retriesCount";
    Email_Select_Column["SentAt"] = "sentAt";
    Email_Select_Column["Subject"] = "subject";
    Email_Select_Column["UpdatedAt"] = "updatedAt";
    Email_Select_Column["UserId"] = "userId";
})(Email_Select_Column = exports.Email_Select_Column || (exports.Email_Select_Column = {}));
var Email_Update_Column;
(function (Email_Update_Column) {
    Email_Update_Column["CreatedAt"] = "createdAt";
    Email_Update_Column["EmailAddress"] = "emailAddress";
    Email_Update_Column["HtmlContents"] = "htmlContents";
    Email_Update_Column["Id"] = "id";
    Email_Update_Column["InvitationId"] = "invitationId";
    Email_Update_Column["PlainTextContents"] = "plainTextContents";
    Email_Update_Column["Reason"] = "reason";
    Email_Update_Column["RecipientName"] = "recipientName";
    Email_Update_Column["RetriesCount"] = "retriesCount";
    Email_Update_Column["SentAt"] = "sentAt";
    Email_Update_Column["Subject"] = "subject";
    Email_Update_Column["UpdatedAt"] = "updatedAt";
    Email_Update_Column["UserId"] = "userId";
})(Email_Update_Column = exports.Email_Update_Column || (exports.Email_Update_Column = {}));
var PushNotificationSubscription_Constraint;
(function (PushNotificationSubscription_Constraint) {
    PushNotificationSubscription_Constraint["PushNotificationSubscriptionPkey"] = "PushNotificationSubscription_pkey";
})(PushNotificationSubscription_Constraint = exports.PushNotificationSubscription_Constraint || (exports.PushNotificationSubscription_Constraint = {}));
var PushNotificationSubscription_Select_Column;
(function (PushNotificationSubscription_Select_Column) {
    PushNotificationSubscription_Select_Column["Auth"] = "auth";
    PushNotificationSubscription_Select_Column["CreatedAt"] = "created_at";
    PushNotificationSubscription_Select_Column["Endpoint"] = "endpoint";
    PushNotificationSubscription_Select_Column["P256dh"] = "p256dh";
    PushNotificationSubscription_Select_Column["UpdatedAt"] = "updated_at";
    PushNotificationSubscription_Select_Column["UserId"] = "userId";
})(PushNotificationSubscription_Select_Column = exports.PushNotificationSubscription_Select_Column || (exports.PushNotificationSubscription_Select_Column = {}));
var PushNotificationSubscription_Update_Column;
(function (PushNotificationSubscription_Update_Column) {
    PushNotificationSubscription_Update_Column["Auth"] = "auth";
    PushNotificationSubscription_Update_Column["CreatedAt"] = "created_at";
    PushNotificationSubscription_Update_Column["Endpoint"] = "endpoint";
    PushNotificationSubscription_Update_Column["P256dh"] = "p256dh";
    PushNotificationSubscription_Update_Column["UpdatedAt"] = "updated_at";
    PushNotificationSubscription_Update_Column["UserId"] = "userId";
})(PushNotificationSubscription_Update_Column = exports.PushNotificationSubscription_Update_Column || (exports.PushNotificationSubscription_Update_Column = {}));
var User_Constraint;
(function (User_Constraint) {
    User_Constraint["UserEmailKey"] = "user_email_key";
    User_Constraint["UserPkey"] = "user_pkey";
})(User_Constraint = exports.User_Constraint || (exports.User_Constraint = {}));
var User_Select_Column;
(function (User_Select_Column) {
    User_Select_Column["AcceptedPrivacyPolicyAt"] = "acceptedPrivacyPolicyAt";
    User_Select_Column["AcceptedTermsAt"] = "acceptedTermsAt";
    User_Select_Column["CreatedAt"] = "createdAt";
    User_Select_Column["Email"] = "email";
    User_Select_Column["Id"] = "id";
    User_Select_Column["UpdatedAt"] = "updatedAt";
})(User_Select_Column = exports.User_Select_Column || (exports.User_Select_Column = {}));
var User_Update_Column;
(function (User_Update_Column) {
    User_Update_Column["AcceptedPrivacyPolicyAt"] = "acceptedPrivacyPolicyAt";
    User_Update_Column["AcceptedTermsAt"] = "acceptedTermsAt";
    User_Update_Column["CreatedAt"] = "createdAt";
    User_Update_Column["Email"] = "email";
    User_Update_Column["Id"] = "id";
    User_Update_Column["UpdatedAt"] = "updatedAt";
})(User_Update_Column = exports.User_Update_Column || (exports.User_Update_Column = {}));
var Analytics_AppStats_Constraint;
(function (Analytics_AppStats_Constraint) {
    Analytics_AppStats_Constraint["AppStatsPkey"] = "AppStats_pkey";
})(Analytics_AppStats_Constraint = exports.Analytics_AppStats_Constraint || (exports.Analytics_AppStats_Constraint = {}));
var Analytics_AppStats_Select_Column;
(function (Analytics_AppStats_Select_Column) {
    Analytics_AppStats_Select_Column["CreatedAt"] = "created_at";
    Analytics_AppStats_Select_Column["Id"] = "id";
    Analytics_AppStats_Select_Column["Pages"] = "pages";
    Analytics_AppStats_Select_Column["TotalUniqueTabs"] = "total_unique_tabs";
    Analytics_AppStats_Select_Column["TotalUniqueUserIds"] = "total_unique_user_ids";
    Analytics_AppStats_Select_Column["UpdatedAt"] = "updated_at";
})(Analytics_AppStats_Select_Column = exports.Analytics_AppStats_Select_Column || (exports.Analytics_AppStats_Select_Column = {}));
var Analytics_AppStats_Update_Column;
(function (Analytics_AppStats_Update_Column) {
    Analytics_AppStats_Update_Column["CreatedAt"] = "created_at";
    Analytics_AppStats_Update_Column["Id"] = "id";
    Analytics_AppStats_Update_Column["Pages"] = "pages";
    Analytics_AppStats_Update_Column["TotalUniqueTabs"] = "total_unique_tabs";
    Analytics_AppStats_Update_Column["TotalUniqueUserIds"] = "total_unique_user_ids";
    Analytics_AppStats_Update_Column["UpdatedAt"] = "updated_at";
})(Analytics_AppStats_Update_Column = exports.Analytics_AppStats_Update_Column || (exports.Analytics_AppStats_Update_Column = {}));
var Analytics_CompletedRegistrations_Select_Column;
(function (Analytics_CompletedRegistrations_Select_Column) {
    Analytics_CompletedRegistrations_Select_Column["Count"] = "count";
    Analytics_CompletedRegistrations_Select_Column["Id"] = "id";
})(Analytics_CompletedRegistrations_Select_Column = exports.Analytics_CompletedRegistrations_Select_Column || (exports.Analytics_CompletedRegistrations_Select_Column = {}));
var Analytics_ContentElementStats_Constraint;
(function (Analytics_ContentElementStats_Constraint) {
    Analytics_ContentElementStats_Constraint["ContentElementStatsIdKey"] = "ContentElementStats_id_key";
    Analytics_ContentElementStats_Constraint["ContentElementStatsPkey"] = "ContentElementStats_pkey";
})(Analytics_ContentElementStats_Constraint = exports.Analytics_ContentElementStats_Constraint || (exports.Analytics_ContentElementStats_Constraint = {}));
var Analytics_ContentElementStats_Select_Column;
(function (Analytics_ContentElementStats_Select_Column) {
    Analytics_ContentElementStats_Select_Column["CreatedAt"] = "created_at";
    Analytics_ContentElementStats_Select_Column["ElementId"] = "elementId";
    Analytics_ContentElementStats_Select_Column["Id"] = "id";
    Analytics_ContentElementStats_Select_Column["UpdatedAt"] = "updated_at";
    Analytics_ContentElementStats_Select_Column["ViewCount"] = "viewCount";
})(Analytics_ContentElementStats_Select_Column = exports.Analytics_ContentElementStats_Select_Column || (exports.Analytics_ContentElementStats_Select_Column = {}));
var Analytics_ContentElementStats_Update_Column;
(function (Analytics_ContentElementStats_Update_Column) {
    Analytics_ContentElementStats_Update_Column["CreatedAt"] = "created_at";
    Analytics_ContentElementStats_Update_Column["ElementId"] = "elementId";
    Analytics_ContentElementStats_Update_Column["Id"] = "id";
    Analytics_ContentElementStats_Update_Column["UpdatedAt"] = "updated_at";
    Analytics_ContentElementStats_Update_Column["ViewCount"] = "viewCount";
})(Analytics_ContentElementStats_Update_Column = exports.Analytics_ContentElementStats_Update_Column || (exports.Analytics_ContentElementStats_Update_Column = {}));
var Analytics_ContentItemStats_Constraint;
(function (Analytics_ContentItemStats_Constraint) {
    Analytics_ContentItemStats_Constraint["ContentItemStatsIdKey"] = "ContentItemStats_id_key";
    Analytics_ContentItemStats_Constraint["ContentItemStatsPkey"] = "ContentItemStats_pkey";
})(Analytics_ContentItemStats_Constraint = exports.Analytics_ContentItemStats_Constraint || (exports.Analytics_ContentItemStats_Constraint = {}));
var Analytics_ContentItemStats_Select_Column;
(function (Analytics_ContentItemStats_Select_Column) {
    Analytics_ContentItemStats_Select_Column["CreatedAt"] = "created_at";
    Analytics_ContentItemStats_Select_Column["Id"] = "id";
    Analytics_ContentItemStats_Select_Column["ItemId"] = "itemId";
    Analytics_ContentItemStats_Select_Column["UpdatedAt"] = "updated_at";
    Analytics_ContentItemStats_Select_Column["ViewCount"] = "viewCount";
})(Analytics_ContentItemStats_Select_Column = exports.Analytics_ContentItemStats_Select_Column || (exports.Analytics_ContentItemStats_Select_Column = {}));
var Analytics_ContentItemStats_Update_Column;
(function (Analytics_ContentItemStats_Update_Column) {
    Analytics_ContentItemStats_Update_Column["CreatedAt"] = "created_at";
    Analytics_ContentItemStats_Update_Column["Id"] = "id";
    Analytics_ContentItemStats_Update_Column["ItemId"] = "itemId";
    Analytics_ContentItemStats_Update_Column["UpdatedAt"] = "updated_at";
    Analytics_ContentItemStats_Update_Column["ViewCount"] = "viewCount";
})(Analytics_ContentItemStats_Update_Column = exports.Analytics_ContentItemStats_Update_Column || (exports.Analytics_ContentItemStats_Update_Column = {}));
var Analytics_ElementTotalViews_Select_Column;
(function (Analytics_ElementTotalViews_Select_Column) {
    Analytics_ElementTotalViews_Select_Column["ElementId"] = "elementId";
    Analytics_ElementTotalViews_Select_Column["TotalViewCount"] = "totalViewCount";
})(Analytics_ElementTotalViews_Select_Column = exports.Analytics_ElementTotalViews_Select_Column || (exports.Analytics_ElementTotalViews_Select_Column = {}));
var Analytics_ItemTotalViews_Select_Column;
(function (Analytics_ItemTotalViews_Select_Column) {
    Analytics_ItemTotalViews_Select_Column["ItemId"] = "itemId";
    Analytics_ItemTotalViews_Select_Column["TotalViewCount"] = "totalViewCount";
})(Analytics_ItemTotalViews_Select_Column = exports.Analytics_ItemTotalViews_Select_Column || (exports.Analytics_ItemTotalViews_Select_Column = {}));
var Analytics_RoomPresence_Select_Column;
(function (Analytics_RoomPresence_Select_Column) {
    Analytics_RoomPresence_Select_Column["Count"] = "count";
    Analytics_RoomPresence_Select_Column["CreatedAt"] = "created_at";
    Analytics_RoomPresence_Select_Column["Id"] = "id";
    Analytics_RoomPresence_Select_Column["Name"] = "name";
})(Analytics_RoomPresence_Select_Column = exports.Analytics_RoomPresence_Select_Column || (exports.Analytics_RoomPresence_Select_Column = {}));
var Analytics_RoomStats_Constraint;
(function (Analytics_RoomStats_Constraint) {
    Analytics_RoomStats_Constraint["RoomStatsPkey"] = "RoomStats_pkey";
})(Analytics_RoomStats_Constraint = exports.Analytics_RoomStats_Constraint || (exports.Analytics_RoomStats_Constraint = {}));
var Analytics_RoomStats_Select_Column;
(function (Analytics_RoomStats_Select_Column) {
    Analytics_RoomStats_Select_Column["CreatedAt"] = "created_at";
    Analytics_RoomStats_Select_Column["HlsViewCount"] = "hlsViewCount";
    Analytics_RoomStats_Select_Column["Id"] = "id";
    Analytics_RoomStats_Select_Column["RoomId"] = "roomId";
    Analytics_RoomStats_Select_Column["UpdatedAt"] = "updated_at";
})(Analytics_RoomStats_Select_Column = exports.Analytics_RoomStats_Select_Column || (exports.Analytics_RoomStats_Select_Column = {}));
var Analytics_RoomStats_Update_Column;
(function (Analytics_RoomStats_Update_Column) {
    Analytics_RoomStats_Update_Column["CreatedAt"] = "created_at";
    Analytics_RoomStats_Update_Column["HlsViewCount"] = "hlsViewCount";
    Analytics_RoomStats_Update_Column["Id"] = "id";
    Analytics_RoomStats_Update_Column["RoomId"] = "roomId";
    Analytics_RoomStats_Update_Column["UpdatedAt"] = "updated_at";
})(Analytics_RoomStats_Update_Column = exports.Analytics_RoomStats_Update_Column || (exports.Analytics_RoomStats_Update_Column = {}));
var Analytics_Mat_ElementTotalViews_Select_Column;
(function (Analytics_Mat_ElementTotalViews_Select_Column) {
    Analytics_Mat_ElementTotalViews_Select_Column["ElementId"] = "elementId";
    Analytics_Mat_ElementTotalViews_Select_Column["TotalViewCount"] = "totalViewCount";
})(Analytics_Mat_ElementTotalViews_Select_Column = exports.Analytics_Mat_ElementTotalViews_Select_Column || (exports.Analytics_Mat_ElementTotalViews_Select_Column = {}));
var Analytics_Mat_ItemTotalViews_Select_Column;
(function (Analytics_Mat_ItemTotalViews_Select_Column) {
    Analytics_Mat_ItemTotalViews_Select_Column["ItemId"] = "itemId";
    Analytics_Mat_ItemTotalViews_Select_Column["TotalViewCount"] = "totalViewCount";
})(Analytics_Mat_ItemTotalViews_Select_Column = exports.Analytics_Mat_ItemTotalViews_Select_Column || (exports.Analytics_Mat_ItemTotalViews_Select_Column = {}));
var Analytics_Mat_RoomPresence_Select_Column;
(function (Analytics_Mat_RoomPresence_Select_Column) {
    Analytics_Mat_RoomPresence_Select_Column["Count"] = "count";
    Analytics_Mat_RoomPresence_Select_Column["CreatedAt"] = "created_at";
    Analytics_Mat_RoomPresence_Select_Column["Id"] = "id";
    Analytics_Mat_RoomPresence_Select_Column["Name"] = "name";
})(Analytics_Mat_RoomPresence_Select_Column = exports.Analytics_Mat_RoomPresence_Select_Column || (exports.Analytics_Mat_RoomPresence_Select_Column = {}));
var Chat_Chat_Constraint;
(function (Chat_Chat_Constraint) {
    Chat_Chat_Constraint["ChatPkey"] = "Chat_pkey";
})(Chat_Chat_Constraint = exports.Chat_Chat_Constraint || (exports.Chat_Chat_Constraint = {}));
var Chat_Chat_Select_Column;
(function (Chat_Chat_Select_Column) {
    Chat_Chat_Select_Column["ConferenceId"] = "conferenceId";
    Chat_Chat_Select_Column["CreatedAt"] = "created_at";
    Chat_Chat_Select_Column["DuplicateToId"] = "duplicateToId";
    Chat_Chat_Select_Column["EnableAutoPin"] = "enableAutoPin";
    Chat_Chat_Select_Column["EnableAutoSubscribe"] = "enableAutoSubscribe";
    Chat_Chat_Select_Column["EnableMandatoryPin"] = "enableMandatoryPin";
    Chat_Chat_Select_Column["EnableMandatorySubscribe"] = "enableMandatorySubscribe";
    Chat_Chat_Select_Column["Id"] = "id";
    Chat_Chat_Select_Column["RemoteServiceId"] = "remoteServiceId";
    Chat_Chat_Select_Column["RestrictToAdmins"] = "restrictToAdmins";
    Chat_Chat_Select_Column["SubconferenceId"] = "subconferenceId";
    Chat_Chat_Select_Column["UpdatedAt"] = "updated_at";
})(Chat_Chat_Select_Column = exports.Chat_Chat_Select_Column || (exports.Chat_Chat_Select_Column = {}));
var Chat_Chat_Update_Column;
(function (Chat_Chat_Update_Column) {
    Chat_Chat_Update_Column["ConferenceId"] = "conferenceId";
    Chat_Chat_Update_Column["CreatedAt"] = "created_at";
    Chat_Chat_Update_Column["DuplicateToId"] = "duplicateToId";
    Chat_Chat_Update_Column["EnableAutoPin"] = "enableAutoPin";
    Chat_Chat_Update_Column["EnableAutoSubscribe"] = "enableAutoSubscribe";
    Chat_Chat_Update_Column["EnableMandatoryPin"] = "enableMandatoryPin";
    Chat_Chat_Update_Column["EnableMandatorySubscribe"] = "enableMandatorySubscribe";
    Chat_Chat_Update_Column["Id"] = "id";
    Chat_Chat_Update_Column["RemoteServiceId"] = "remoteServiceId";
    Chat_Chat_Update_Column["RestrictToAdmins"] = "restrictToAdmins";
    Chat_Chat_Update_Column["SubconferenceId"] = "subconferenceId";
    Chat_Chat_Update_Column["UpdatedAt"] = "updated_at";
})(Chat_Chat_Update_Column = exports.Chat_Chat_Update_Column || (exports.Chat_Chat_Update_Column = {}));
var Chat_FlagType_Constraint;
(function (Chat_FlagType_Constraint) {
    Chat_FlagType_Constraint["FlagTypePkey"] = "FlagType_pkey";
})(Chat_FlagType_Constraint = exports.Chat_FlagType_Constraint || (exports.Chat_FlagType_Constraint = {}));
var Chat_FlagType_Enum;
(function (Chat_FlagType_Enum) {
    Chat_FlagType_Enum["Abusive"] = "Abusive";
    Chat_FlagType_Enum["Disinformation"] = "Disinformation";
    Chat_FlagType_Enum["Misleading"] = "Misleading";
    Chat_FlagType_Enum["RiskToLife"] = "Risk_To_Life";
    Chat_FlagType_Enum["Spam"] = "Spam";
})(Chat_FlagType_Enum = exports.Chat_FlagType_Enum || (exports.Chat_FlagType_Enum = {}));
var Chat_FlagType_Select_Column;
(function (Chat_FlagType_Select_Column) {
    Chat_FlagType_Select_Column["Description"] = "description";
    Chat_FlagType_Select_Column["Name"] = "name";
})(Chat_FlagType_Select_Column = exports.Chat_FlagType_Select_Column || (exports.Chat_FlagType_Select_Column = {}));
var Chat_FlagType_Update_Column;
(function (Chat_FlagType_Update_Column) {
    Chat_FlagType_Update_Column["Description"] = "description";
    Chat_FlagType_Update_Column["Name"] = "name";
})(Chat_FlagType_Update_Column = exports.Chat_FlagType_Update_Column || (exports.Chat_FlagType_Update_Column = {}));
var Chat_Flag_Constraint;
(function (Chat_Flag_Constraint) {
    Chat_Flag_Constraint["FlagFlaggedByIdMessageSIdTypeKey"] = "Flag_flaggedById_messageSId_type_key";
    Chat_Flag_Constraint["FlagPkey"] = "Flag_pkey";
})(Chat_Flag_Constraint = exports.Chat_Flag_Constraint || (exports.Chat_Flag_Constraint = {}));
var Chat_Flag_Select_Column;
(function (Chat_Flag_Select_Column) {
    Chat_Flag_Select_Column["CreatedAt"] = "created_at";
    Chat_Flag_Select_Column["DiscussionChatId"] = "discussionChatId";
    Chat_Flag_Select_Column["FlaggedById"] = "flaggedById";
    Chat_Flag_Select_Column["Id"] = "id";
    Chat_Flag_Select_Column["MessageSId"] = "messageSId";
    Chat_Flag_Select_Column["Notes"] = "notes";
    Chat_Flag_Select_Column["Resolution"] = "resolution";
    Chat_Flag_Select_Column["ResolvedAt"] = "resolved_at";
    Chat_Flag_Select_Column["Type"] = "type";
    Chat_Flag_Select_Column["UpdatedAt"] = "updated_at";
})(Chat_Flag_Select_Column = exports.Chat_Flag_Select_Column || (exports.Chat_Flag_Select_Column = {}));
var Chat_Flag_Update_Column;
(function (Chat_Flag_Update_Column) {
    Chat_Flag_Update_Column["CreatedAt"] = "created_at";
    Chat_Flag_Update_Column["DiscussionChatId"] = "discussionChatId";
    Chat_Flag_Update_Column["FlaggedById"] = "flaggedById";
    Chat_Flag_Update_Column["Id"] = "id";
    Chat_Flag_Update_Column["MessageSId"] = "messageSId";
    Chat_Flag_Update_Column["Notes"] = "notes";
    Chat_Flag_Update_Column["Resolution"] = "resolution";
    Chat_Flag_Update_Column["ResolvedAt"] = "resolved_at";
    Chat_Flag_Update_Column["Type"] = "type";
    Chat_Flag_Update_Column["UpdatedAt"] = "updated_at";
})(Chat_Flag_Update_Column = exports.Chat_Flag_Update_Column || (exports.Chat_Flag_Update_Column = {}));
var Chat_MessageType_Constraint;
(function (Chat_MessageType_Constraint) {
    Chat_MessageType_Constraint["MessageTypePkey"] = "MessageType_pkey";
})(Chat_MessageType_Constraint = exports.Chat_MessageType_Constraint || (exports.Chat_MessageType_Constraint = {}));
var Chat_MessageType_Enum;
(function (Chat_MessageType_Enum) {
    Chat_MessageType_Enum["Answer"] = "ANSWER";
    Chat_MessageType_Enum["DuplicationMarker"] = "DUPLICATION_MARKER";
    Chat_MessageType_Enum["Emote"] = "EMOTE";
    Chat_MessageType_Enum["Message"] = "MESSAGE";
    Chat_MessageType_Enum["Poll"] = "POLL";
    Chat_MessageType_Enum["PollResults"] = "POLL_RESULTS";
    Chat_MessageType_Enum["Question"] = "QUESTION";
})(Chat_MessageType_Enum = exports.Chat_MessageType_Enum || (exports.Chat_MessageType_Enum = {}));
var Chat_MessageType_Select_Column;
(function (Chat_MessageType_Select_Column) {
    Chat_MessageType_Select_Column["Name"] = "name";
})(Chat_MessageType_Select_Column = exports.Chat_MessageType_Select_Column || (exports.Chat_MessageType_Select_Column = {}));
var Chat_MessageType_Update_Column;
(function (Chat_MessageType_Update_Column) {
    Chat_MessageType_Update_Column["Name"] = "name";
})(Chat_MessageType_Update_Column = exports.Chat_MessageType_Update_Column || (exports.Chat_MessageType_Update_Column = {}));
var Chat_Message_Constraint;
(function (Chat_Message_Constraint) {
    Chat_Message_Constraint["MessageDuplicatedMessageSIdKey"] = "Message_duplicatedMessageSId_key";
    Chat_Message_Constraint["MessagePkey"] = "Message_pkey";
    Chat_Message_Constraint["MessageSIdChatIdKey"] = "Message_sId_chatId_key";
    Chat_Message_Constraint["MessageSIdKey"] = "Message_sId_key";
    Chat_Message_Constraint["MessageSystemIdKey"] = "Message_systemId_key";
})(Chat_Message_Constraint = exports.Chat_Message_Constraint || (exports.Chat_Message_Constraint = {}));
var Chat_Message_Select_Column;
(function (Chat_Message_Select_Column) {
    Chat_Message_Select_Column["ChatId"] = "chatId";
    Chat_Message_Select_Column["CreatedAt"] = "created_at";
    Chat_Message_Select_Column["Data"] = "data";
    Chat_Message_Select_Column["DuplicatedMessageSId"] = "duplicatedMessageSId";
    Chat_Message_Select_Column["Id"] = "id";
    Chat_Message_Select_Column["IsPinned"] = "isPinned";
    Chat_Message_Select_Column["Message"] = "message";
    Chat_Message_Select_Column["SId"] = "sId";
    Chat_Message_Select_Column["SenderId"] = "senderId";
    Chat_Message_Select_Column["SystemId"] = "systemId";
    Chat_Message_Select_Column["Type"] = "type";
    Chat_Message_Select_Column["UpdatedAt"] = "updated_at";
})(Chat_Message_Select_Column = exports.Chat_Message_Select_Column || (exports.Chat_Message_Select_Column = {}));
var Chat_Message_Update_Column;
(function (Chat_Message_Update_Column) {
    Chat_Message_Update_Column["ChatId"] = "chatId";
    Chat_Message_Update_Column["CreatedAt"] = "created_at";
    Chat_Message_Update_Column["Data"] = "data";
    Chat_Message_Update_Column["DuplicatedMessageSId"] = "duplicatedMessageSId";
    Chat_Message_Update_Column["Id"] = "id";
    Chat_Message_Update_Column["IsPinned"] = "isPinned";
    Chat_Message_Update_Column["Message"] = "message";
    Chat_Message_Update_Column["SId"] = "sId";
    Chat_Message_Update_Column["SenderId"] = "senderId";
    Chat_Message_Update_Column["SystemId"] = "systemId";
    Chat_Message_Update_Column["Type"] = "type";
    Chat_Message_Update_Column["UpdatedAt"] = "updated_at";
})(Chat_Message_Update_Column = exports.Chat_Message_Update_Column || (exports.Chat_Message_Update_Column = {}));
var Chat_Pin_Constraint;
(function (Chat_Pin_Constraint) {
    Chat_Pin_Constraint["ChatPinPkey"] = "ChatPin_pkey";
})(Chat_Pin_Constraint = exports.Chat_Pin_Constraint || (exports.Chat_Pin_Constraint = {}));
var Chat_Pin_Select_Column;
(function (Chat_Pin_Select_Column) {
    Chat_Pin_Select_Column["ChatId"] = "chatId";
    Chat_Pin_Select_Column["CreatedAt"] = "created_at";
    Chat_Pin_Select_Column["RegistrantId"] = "registrantId";
    Chat_Pin_Select_Column["WasManuallyPinned"] = "wasManuallyPinned";
})(Chat_Pin_Select_Column = exports.Chat_Pin_Select_Column || (exports.Chat_Pin_Select_Column = {}));
var Chat_Pin_Update_Column;
(function (Chat_Pin_Update_Column) {
    Chat_Pin_Update_Column["ChatId"] = "chatId";
    Chat_Pin_Update_Column["CreatedAt"] = "created_at";
    Chat_Pin_Update_Column["RegistrantId"] = "registrantId";
    Chat_Pin_Update_Column["WasManuallyPinned"] = "wasManuallyPinned";
})(Chat_Pin_Update_Column = exports.Chat_Pin_Update_Column || (exports.Chat_Pin_Update_Column = {}));
var Chat_ReactionType_Constraint;
(function (Chat_ReactionType_Constraint) {
    Chat_ReactionType_Constraint["ReactionTypePkey"] = "ReactionType_pkey";
})(Chat_ReactionType_Constraint = exports.Chat_ReactionType_Constraint || (exports.Chat_ReactionType_Constraint = {}));
var Chat_ReactionType_Enum;
(function (Chat_ReactionType_Enum) {
    Chat_ReactionType_Enum["Answer"] = "ANSWER";
    Chat_ReactionType_Enum["Emoji"] = "EMOJI";
    Chat_ReactionType_Enum["PollChoice"] = "POLL_CHOICE";
    Chat_ReactionType_Enum["PollClosed"] = "POLL_CLOSED";
    Chat_ReactionType_Enum["PollComplete"] = "POLL_COMPLETE";
})(Chat_ReactionType_Enum = exports.Chat_ReactionType_Enum || (exports.Chat_ReactionType_Enum = {}));
var Chat_ReactionType_Select_Column;
(function (Chat_ReactionType_Select_Column) {
    Chat_ReactionType_Select_Column["Description"] = "description";
    Chat_ReactionType_Select_Column["Name"] = "name";
})(Chat_ReactionType_Select_Column = exports.Chat_ReactionType_Select_Column || (exports.Chat_ReactionType_Select_Column = {}));
var Chat_ReactionType_Update_Column;
(function (Chat_ReactionType_Update_Column) {
    Chat_ReactionType_Update_Column["Description"] = "description";
    Chat_ReactionType_Update_Column["Name"] = "name";
})(Chat_ReactionType_Update_Column = exports.Chat_ReactionType_Update_Column || (exports.Chat_ReactionType_Update_Column = {}));
var Chat_Reaction_Constraint;
(function (Chat_Reaction_Constraint) {
    Chat_Reaction_Constraint["ReactionPkey"] = "Reaction_pkey";
    Chat_Reaction_Constraint["ReactionSIdKey"] = "Reaction_sId_key";
})(Chat_Reaction_Constraint = exports.Chat_Reaction_Constraint || (exports.Chat_Reaction_Constraint = {}));
var Chat_Reaction_Select_Column;
(function (Chat_Reaction_Select_Column) {
    Chat_Reaction_Select_Column["ChatId"] = "chatId";
    Chat_Reaction_Select_Column["CreatedAt"] = "created_at";
    Chat_Reaction_Select_Column["Data"] = "data";
    Chat_Reaction_Select_Column["DuplicateSId"] = "duplicateSId";
    Chat_Reaction_Select_Column["MessageSId"] = "messageSId";
    Chat_Reaction_Select_Column["SId"] = "sId";
    Chat_Reaction_Select_Column["SenderId"] = "senderId";
    Chat_Reaction_Select_Column["Symbol"] = "symbol";
    Chat_Reaction_Select_Column["Type"] = "type";
    Chat_Reaction_Select_Column["UpdatedAt"] = "updated_at";
})(Chat_Reaction_Select_Column = exports.Chat_Reaction_Select_Column || (exports.Chat_Reaction_Select_Column = {}));
var Chat_Reaction_Update_Column;
(function (Chat_Reaction_Update_Column) {
    Chat_Reaction_Update_Column["ChatId"] = "chatId";
    Chat_Reaction_Update_Column["CreatedAt"] = "created_at";
    Chat_Reaction_Update_Column["Data"] = "data";
    Chat_Reaction_Update_Column["DuplicateSId"] = "duplicateSId";
    Chat_Reaction_Update_Column["MessageSId"] = "messageSId";
    Chat_Reaction_Update_Column["SId"] = "sId";
    Chat_Reaction_Update_Column["SenderId"] = "senderId";
    Chat_Reaction_Update_Column["Symbol"] = "symbol";
    Chat_Reaction_Update_Column["Type"] = "type";
    Chat_Reaction_Update_Column["UpdatedAt"] = "updated_at";
})(Chat_Reaction_Update_Column = exports.Chat_Reaction_Update_Column || (exports.Chat_Reaction_Update_Column = {}));
var Chat_ReadUpToIndex_Constraint;
(function (Chat_ReadUpToIndex_Constraint) {
    Chat_ReadUpToIndex_Constraint["ReadUpToIndexPkey"] = "ReadUpToIndex_pkey";
})(Chat_ReadUpToIndex_Constraint = exports.Chat_ReadUpToIndex_Constraint || (exports.Chat_ReadUpToIndex_Constraint = {}));
var Chat_ReadUpToIndex_Select_Column;
(function (Chat_ReadUpToIndex_Select_Column) {
    Chat_ReadUpToIndex_Select_Column["ChatId"] = "chatId";
    Chat_ReadUpToIndex_Select_Column["MessageSId"] = "messageSId";
    Chat_ReadUpToIndex_Select_Column["RegistrantId"] = "registrantId";
    Chat_ReadUpToIndex_Select_Column["UpdatedAt"] = "updated_at";
})(Chat_ReadUpToIndex_Select_Column = exports.Chat_ReadUpToIndex_Select_Column || (exports.Chat_ReadUpToIndex_Select_Column = {}));
var Chat_ReadUpToIndex_Update_Column;
(function (Chat_ReadUpToIndex_Update_Column) {
    Chat_ReadUpToIndex_Update_Column["ChatId"] = "chatId";
    Chat_ReadUpToIndex_Update_Column["MessageSId"] = "messageSId";
    Chat_ReadUpToIndex_Update_Column["RegistrantId"] = "registrantId";
    Chat_ReadUpToIndex_Update_Column["UpdatedAt"] = "updated_at";
})(Chat_ReadUpToIndex_Update_Column = exports.Chat_ReadUpToIndex_Update_Column || (exports.Chat_ReadUpToIndex_Update_Column = {}));
var Chat_Subscription_Constraint;
(function (Chat_Subscription_Constraint) {
    Chat_Subscription_Constraint["SubscriptionPkey"] = "Subscription_pkey";
})(Chat_Subscription_Constraint = exports.Chat_Subscription_Constraint || (exports.Chat_Subscription_Constraint = {}));
var Chat_Subscription_Select_Column;
(function (Chat_Subscription_Select_Column) {
    Chat_Subscription_Select_Column["ChatId"] = "chatId";
    Chat_Subscription_Select_Column["CreatedAt"] = "created_at";
    Chat_Subscription_Select_Column["RegistrantId"] = "registrantId";
    Chat_Subscription_Select_Column["WasManuallySubscribed"] = "wasManuallySubscribed";
})(Chat_Subscription_Select_Column = exports.Chat_Subscription_Select_Column || (exports.Chat_Subscription_Select_Column = {}));
var Chat_Subscription_Update_Column;
(function (Chat_Subscription_Update_Column) {
    Chat_Subscription_Update_Column["ChatId"] = "chatId";
    Chat_Subscription_Update_Column["CreatedAt"] = "created_at";
    Chat_Subscription_Update_Column["RegistrantId"] = "registrantId";
    Chat_Subscription_Update_Column["WasManuallySubscribed"] = "wasManuallySubscribed";
})(Chat_Subscription_Update_Column = exports.Chat_Subscription_Update_Column || (exports.Chat_Subscription_Update_Column = {}));
var Collection_Exhibition_Constraint;
(function (Collection_Exhibition_Constraint) {
    Collection_Exhibition_Constraint["ExhibitionNameConferenceIdFkey"] = "Exhibition_name_conferenceId_fkey";
    Collection_Exhibition_Constraint["ExhibitionPkey"] = "Exhibition_pkey";
})(Collection_Exhibition_Constraint = exports.Collection_Exhibition_Constraint || (exports.Collection_Exhibition_Constraint = {}));
var Collection_Exhibition_Select_Column;
(function (Collection_Exhibition_Select_Column) {
    Collection_Exhibition_Select_Column["Colour"] = "colour";
    Collection_Exhibition_Select_Column["ConferenceId"] = "conferenceId";
    Collection_Exhibition_Select_Column["CreatedAt"] = "created_at";
    Collection_Exhibition_Select_Column["DescriptiveItemId"] = "descriptiveItemId";
    Collection_Exhibition_Select_Column["Id"] = "id";
    Collection_Exhibition_Select_Column["IsHidden"] = "isHidden";
    Collection_Exhibition_Select_Column["Name"] = "name";
    Collection_Exhibition_Select_Column["Priority"] = "priority";
    Collection_Exhibition_Select_Column["SubconferenceId"] = "subconferenceId";
    Collection_Exhibition_Select_Column["UpdatedAt"] = "updated_at";
    Collection_Exhibition_Select_Column["VisibilityLevel"] = "visibilityLevel";
})(Collection_Exhibition_Select_Column = exports.Collection_Exhibition_Select_Column || (exports.Collection_Exhibition_Select_Column = {}));
var Collection_Exhibition_Update_Column;
(function (Collection_Exhibition_Update_Column) {
    Collection_Exhibition_Update_Column["Colour"] = "colour";
    Collection_Exhibition_Update_Column["ConferenceId"] = "conferenceId";
    Collection_Exhibition_Update_Column["CreatedAt"] = "created_at";
    Collection_Exhibition_Update_Column["DescriptiveItemId"] = "descriptiveItemId";
    Collection_Exhibition_Update_Column["Id"] = "id";
    Collection_Exhibition_Update_Column["IsHidden"] = "isHidden";
    Collection_Exhibition_Update_Column["Name"] = "name";
    Collection_Exhibition_Update_Column["Priority"] = "priority";
    Collection_Exhibition_Update_Column["SubconferenceId"] = "subconferenceId";
    Collection_Exhibition_Update_Column["UpdatedAt"] = "updated_at";
    Collection_Exhibition_Update_Column["VisibilityLevel"] = "visibilityLevel";
})(Collection_Exhibition_Update_Column = exports.Collection_Exhibition_Update_Column || (exports.Collection_Exhibition_Update_Column = {}));
var Collection_ProgramPerson_Constraint;
(function (Collection_ProgramPerson_Constraint) {
    Collection_ProgramPerson_Constraint["ProgramPersonConferenceIdNameAffiliationKey"] = "ProgramPerson_conferenceId_name_affiliation_key";
    Collection_ProgramPerson_Constraint["ProgramPersonPkey"] = "ProgramPerson_pkey";
    Collection_ProgramPerson_Constraint["CollectionProgramPersonAccessToken"] = "collection_ProgramPerson_accessToken";
})(Collection_ProgramPerson_Constraint = exports.Collection_ProgramPerson_Constraint || (exports.Collection_ProgramPerson_Constraint = {}));
var Collection_ProgramPerson_Select_Column;
(function (Collection_ProgramPerson_Select_Column) {
    Collection_ProgramPerson_Select_Column["AccessToken"] = "accessToken";
    Collection_ProgramPerson_Select_Column["Affiliation"] = "affiliation";
    Collection_ProgramPerson_Select_Column["ConferenceId"] = "conferenceId";
    Collection_ProgramPerson_Select_Column["Email"] = "email";
    Collection_ProgramPerson_Select_Column["Id"] = "id";
    Collection_ProgramPerson_Select_Column["Name"] = "name";
    Collection_ProgramPerson_Select_Column["OriginatingDataId"] = "originatingDataId";
    Collection_ProgramPerson_Select_Column["RegistrantId"] = "registrantId";
    Collection_ProgramPerson_Select_Column["SubconferenceId"] = "subconferenceId";
    Collection_ProgramPerson_Select_Column["SubmissionRequestsSentCount"] = "submissionRequestsSentCount";
    Collection_ProgramPerson_Select_Column["VisibilityLevel"] = "visibilityLevel";
})(Collection_ProgramPerson_Select_Column = exports.Collection_ProgramPerson_Select_Column || (exports.Collection_ProgramPerson_Select_Column = {}));
var Collection_ProgramPerson_Update_Column;
(function (Collection_ProgramPerson_Update_Column) {
    Collection_ProgramPerson_Update_Column["AccessToken"] = "accessToken";
    Collection_ProgramPerson_Update_Column["Affiliation"] = "affiliation";
    Collection_ProgramPerson_Update_Column["ConferenceId"] = "conferenceId";
    Collection_ProgramPerson_Update_Column["Email"] = "email";
    Collection_ProgramPerson_Update_Column["Id"] = "id";
    Collection_ProgramPerson_Update_Column["Name"] = "name";
    Collection_ProgramPerson_Update_Column["OriginatingDataId"] = "originatingDataId";
    Collection_ProgramPerson_Update_Column["RegistrantId"] = "registrantId";
    Collection_ProgramPerson_Update_Column["SubconferenceId"] = "subconferenceId";
    Collection_ProgramPerson_Update_Column["SubmissionRequestsSentCount"] = "submissionRequestsSentCount";
    Collection_ProgramPerson_Update_Column["VisibilityLevel"] = "visibilityLevel";
})(Collection_ProgramPerson_Update_Column = exports.Collection_ProgramPerson_Update_Column || (exports.Collection_ProgramPerson_Update_Column = {}));
var Collection_Tag_Constraint;
(function (Collection_Tag_Constraint) {
    Collection_Tag_Constraint["TagPkey"] = "Tag_pkey";
})(Collection_Tag_Constraint = exports.Collection_Tag_Constraint || (exports.Collection_Tag_Constraint = {}));
var Collection_Tag_Select_Column;
(function (Collection_Tag_Select_Column) {
    Collection_Tag_Select_Column["Colour"] = "colour";
    Collection_Tag_Select_Column["ConferenceId"] = "conferenceId";
    Collection_Tag_Select_Column["CreatedAt"] = "createdAt";
    Collection_Tag_Select_Column["Id"] = "id";
    Collection_Tag_Select_Column["Name"] = "name";
    Collection_Tag_Select_Column["OriginatingDataId"] = "originatingDataId";
    Collection_Tag_Select_Column["Priority"] = "priority";
    Collection_Tag_Select_Column["SubconferenceId"] = "subconferenceId";
    Collection_Tag_Select_Column["UpdatedAt"] = "updatedAt";
    Collection_Tag_Select_Column["VisibilityLevel"] = "visibilityLevel";
})(Collection_Tag_Select_Column = exports.Collection_Tag_Select_Column || (exports.Collection_Tag_Select_Column = {}));
var Collection_Tag_Update_Column;
(function (Collection_Tag_Update_Column) {
    Collection_Tag_Update_Column["Colour"] = "colour";
    Collection_Tag_Update_Column["ConferenceId"] = "conferenceId";
    Collection_Tag_Update_Column["CreatedAt"] = "createdAt";
    Collection_Tag_Update_Column["Id"] = "id";
    Collection_Tag_Update_Column["Name"] = "name";
    Collection_Tag_Update_Column["OriginatingDataId"] = "originatingDataId";
    Collection_Tag_Update_Column["Priority"] = "priority";
    Collection_Tag_Update_Column["SubconferenceId"] = "subconferenceId";
    Collection_Tag_Update_Column["UpdatedAt"] = "updatedAt";
    Collection_Tag_Update_Column["VisibilityLevel"] = "visibilityLevel";
})(Collection_Tag_Update_Column = exports.Collection_Tag_Update_Column || (exports.Collection_Tag_Update_Column = {}));
var Conference_Conference_Constraint;
(function (Conference_Conference_Constraint) {
    Conference_Conference_Constraint["ConferenceDemoCodeIdKey"] = "Conference_demoCodeId_key";
    Conference_Conference_Constraint["ConferenceNameKey"] = "Conference_name_key";
    Conference_Conference_Constraint["ConferencePkey"] = "Conference_pkey";
    Conference_Conference_Constraint["ConferenceShortNameKey"] = "Conference_shortName_key";
    Conference_Conference_Constraint["ConferenceSlugKey"] = "Conference_slug_key";
})(Conference_Conference_Constraint = exports.Conference_Conference_Constraint || (exports.Conference_Conference_Constraint = {}));
var Conference_Conference_Select_Column;
(function (Conference_Conference_Select_Column) {
    Conference_Conference_Select_Column["ConferenceVisibilityLevel"] = "conferenceVisibilityLevel";
    Conference_Conference_Select_Column["CreatedAt"] = "createdAt";
    Conference_Conference_Select_Column["CreatedBy"] = "createdBy";
    Conference_Conference_Select_Column["DefaultProgramVisibilityLevel"] = "defaultProgramVisibilityLevel";
    Conference_Conference_Select_Column["DemoCodeId"] = "demoCodeId";
    Conference_Conference_Select_Column["Id"] = "id";
    Conference_Conference_Select_Column["Name"] = "name";
    Conference_Conference_Select_Column["ShortName"] = "shortName";
    Conference_Conference_Select_Column["Slug"] = "slug";
    Conference_Conference_Select_Column["UpdatedAt"] = "updatedAt";
})(Conference_Conference_Select_Column = exports.Conference_Conference_Select_Column || (exports.Conference_Conference_Select_Column = {}));
var Conference_Conference_Update_Column;
(function (Conference_Conference_Update_Column) {
    Conference_Conference_Update_Column["ConferenceVisibilityLevel"] = "conferenceVisibilityLevel";
    Conference_Conference_Update_Column["CreatedAt"] = "createdAt";
    Conference_Conference_Update_Column["CreatedBy"] = "createdBy";
    Conference_Conference_Update_Column["DefaultProgramVisibilityLevel"] = "defaultProgramVisibilityLevel";
    Conference_Conference_Update_Column["DemoCodeId"] = "demoCodeId";
    Conference_Conference_Update_Column["Id"] = "id";
    Conference_Conference_Update_Column["Name"] = "name";
    Conference_Conference_Update_Column["ShortName"] = "shortName";
    Conference_Conference_Update_Column["Slug"] = "slug";
    Conference_Conference_Update_Column["UpdatedAt"] = "updatedAt";
})(Conference_Conference_Update_Column = exports.Conference_Conference_Update_Column || (exports.Conference_Conference_Update_Column = {}));
var Conference_ConfigurationKey_Constraint;
(function (Conference_ConfigurationKey_Constraint) {
    Conference_ConfigurationKey_Constraint["ConfigurationKeyPkey"] = "ConfigurationKey_pkey";
})(Conference_ConfigurationKey_Constraint = exports.Conference_ConfigurationKey_Constraint || (exports.Conference_ConfigurationKey_Constraint = {}));
var Conference_ConfigurationKey_Enum;
(function (Conference_ConfigurationKey_Enum) {
    Conference_ConfigurationKey_Enum["BackgroundVideos"] = "BACKGROUND_VIDEOS";
    Conference_ConfigurationKey_Enum["ClowdrAppVersion"] = "CLOWDR_APP_VERSION";
    Conference_ConfigurationKey_Enum["DisableAllEventsForItem"] = "DISABLE_ALL_EVENTS_FOR_ITEM";
    Conference_ConfigurationKey_Enum["DisableNearbyEvents"] = "DISABLE_NEARBY_EVENTS";
    Conference_ConfigurationKey_Enum["EmailTemplateSubmissionRequest"] = "EMAIL_TEMPLATE_SUBMISSION_REQUEST";
    Conference_ConfigurationKey_Enum["EmailTemplateSubtitlesGenerated"] = "EMAIL_TEMPLATE_SUBTITLES_GENERATED";
    Conference_ConfigurationKey_Enum["EnableBackstageStreamPreview"] = "ENABLE_BACKSTAGE_STREAM_PREVIEW";
    Conference_ConfigurationKey_Enum["EnableExternalRtmpBroadcast"] = "ENABLE_EXTERNAL_RTMP_BROADCAST";
    Conference_ConfigurationKey_Enum["FillerVideos"] = "FILLER_VIDEOS";
    Conference_ConfigurationKey_Enum["ForceMenuSponsorsLink"] = "FORCE_MENU_SPONSORS_LINK";
    Conference_ConfigurationKey_Enum["FrontendHost"] = "FRONTEND_HOST";
    Conference_ConfigurationKey_Enum["HiddenExhibitionsLabel"] = "HIDDEN_EXHIBITIONS_LABEL";
    Conference_ConfigurationKey_Enum["InputLossSlate"] = "INPUT_LOSS_SLATE";
    Conference_ConfigurationKey_Enum["MyBackstagesNotice"] = "MY_BACKSTAGES_NOTICE";
    Conference_ConfigurationKey_Enum["RegistrationUrl"] = "REGISTRATION_URL";
    Conference_ConfigurationKey_Enum["ScheduleViewVersion"] = "SCHEDULE_VIEW_VERSION";
    Conference_ConfigurationKey_Enum["SponsorsLabel"] = "SPONSORS_LABEL";
    Conference_ConfigurationKey_Enum["SupportAddress"] = "SUPPORT_ADDRESS";
    Conference_ConfigurationKey_Enum["TechSupportAddress"] = "TECH_SUPPORT_ADDRESS";
    Conference_ConfigurationKey_Enum["ThemeComponentColors"] = "THEME_COMPONENT_COLORS";
    Conference_ConfigurationKey_Enum["UploadAgreement"] = "UPLOAD_AGREEMENT";
    Conference_ConfigurationKey_Enum["UploadCutoffTimestamp"] = "UPLOAD_CUTOFF_TIMESTAMP";
    Conference_ConfigurationKey_Enum["VisibleExhibitionsLabel"] = "VISIBLE_EXHIBITIONS_LABEL";
    Conference_ConfigurationKey_Enum["VonageMaxSimultaneousScreenShares"] = "VONAGE_MAX_SIMULTANEOUS_SCREEN_SHARES";
})(Conference_ConfigurationKey_Enum = exports.Conference_ConfigurationKey_Enum || (exports.Conference_ConfigurationKey_Enum = {}));
var Conference_ConfigurationKey_Select_Column;
(function (Conference_ConfigurationKey_Select_Column) {
    Conference_ConfigurationKey_Select_Column["Description"] = "description";
    Conference_ConfigurationKey_Select_Column["Name"] = "name";
})(Conference_ConfigurationKey_Select_Column = exports.Conference_ConfigurationKey_Select_Column || (exports.Conference_ConfigurationKey_Select_Column = {}));
var Conference_ConfigurationKey_Update_Column;
(function (Conference_ConfigurationKey_Update_Column) {
    Conference_ConfigurationKey_Update_Column["Description"] = "description";
    Conference_ConfigurationKey_Update_Column["Name"] = "name";
})(Conference_ConfigurationKey_Update_Column = exports.Conference_ConfigurationKey_Update_Column || (exports.Conference_ConfigurationKey_Update_Column = {}));
var Conference_Configuration_Constraint;
(function (Conference_Configuration_Constraint) {
    Conference_Configuration_Constraint["ConfigurationPkey"] = "Configuration_pkey";
})(Conference_Configuration_Constraint = exports.Conference_Configuration_Constraint || (exports.Conference_Configuration_Constraint = {}));
var Conference_Configuration_Select_Column;
(function (Conference_Configuration_Select_Column) {
    Conference_Configuration_Select_Column["ConferenceId"] = "conferenceId";
    Conference_Configuration_Select_Column["CreatedAt"] = "createdAt";
    Conference_Configuration_Select_Column["Key"] = "key";
    Conference_Configuration_Select_Column["UpdatedAt"] = "updatedAt";
    Conference_Configuration_Select_Column["Value"] = "value";
})(Conference_Configuration_Select_Column = exports.Conference_Configuration_Select_Column || (exports.Conference_Configuration_Select_Column = {}));
var Conference_Configuration_Update_Column;
(function (Conference_Configuration_Update_Column) {
    Conference_Configuration_Update_Column["ConferenceId"] = "conferenceId";
    Conference_Configuration_Update_Column["CreatedAt"] = "createdAt";
    Conference_Configuration_Update_Column["Key"] = "key";
    Conference_Configuration_Update_Column["UpdatedAt"] = "updatedAt";
    Conference_Configuration_Update_Column["Value"] = "value";
})(Conference_Configuration_Update_Column = exports.Conference_Configuration_Update_Column || (exports.Conference_Configuration_Update_Column = {}));
var Conference_DemoCode_Constraint;
(function (Conference_DemoCode_Constraint) {
    Conference_DemoCode_Constraint["DemoCodePkey"] = "DemoCode_pkey";
})(Conference_DemoCode_Constraint = exports.Conference_DemoCode_Constraint || (exports.Conference_DemoCode_Constraint = {}));
var Conference_DemoCode_Select_Column;
(function (Conference_DemoCode_Select_Column) {
    Conference_DemoCode_Select_Column["CreatedAt"] = "createdAt";
    Conference_DemoCode_Select_Column["Id"] = "id";
    Conference_DemoCode_Select_Column["Note"] = "note";
    Conference_DemoCode_Select_Column["UpdatedAt"] = "updatedAt";
    Conference_DemoCode_Select_Column["UsedById"] = "usedById";
})(Conference_DemoCode_Select_Column = exports.Conference_DemoCode_Select_Column || (exports.Conference_DemoCode_Select_Column = {}));
var Conference_DemoCode_Update_Column;
(function (Conference_DemoCode_Update_Column) {
    Conference_DemoCode_Update_Column["CreatedAt"] = "createdAt";
    Conference_DemoCode_Update_Column["Id"] = "id";
    Conference_DemoCode_Update_Column["Note"] = "note";
    Conference_DemoCode_Update_Column["UpdatedAt"] = "updatedAt";
    Conference_DemoCode_Update_Column["UsedById"] = "usedById";
})(Conference_DemoCode_Update_Column = exports.Conference_DemoCode_Update_Column || (exports.Conference_DemoCode_Update_Column = {}));
var Conference_OriginatingData_Constraint;
(function (Conference_OriginatingData_Constraint) {
    Conference_OriginatingData_Constraint["OriginatingDataPkey"] = "OriginatingData_pkey";
    Conference_OriginatingData_Constraint["OriginatingDataSourceIdConferenceIdKey"] = "OriginatingData_sourceId_conferenceId_key";
})(Conference_OriginatingData_Constraint = exports.Conference_OriginatingData_Constraint || (exports.Conference_OriginatingData_Constraint = {}));
var Conference_OriginatingData_Select_Column;
(function (Conference_OriginatingData_Select_Column) {
    Conference_OriginatingData_Select_Column["ConferenceId"] = "conferenceId";
    Conference_OriginatingData_Select_Column["CreatedAt"] = "createdAt";
    Conference_OriginatingData_Select_Column["Data"] = "data";
    Conference_OriginatingData_Select_Column["Id"] = "id";
    Conference_OriginatingData_Select_Column["SourceId"] = "sourceId";
    Conference_OriginatingData_Select_Column["SubconferenceId"] = "subconferenceId";
    Conference_OriginatingData_Select_Column["UpdatedAt"] = "updatedAt";
})(Conference_OriginatingData_Select_Column = exports.Conference_OriginatingData_Select_Column || (exports.Conference_OriginatingData_Select_Column = {}));
var Conference_OriginatingData_Update_Column;
(function (Conference_OriginatingData_Update_Column) {
    Conference_OriginatingData_Update_Column["ConferenceId"] = "conferenceId";
    Conference_OriginatingData_Update_Column["CreatedAt"] = "createdAt";
    Conference_OriginatingData_Update_Column["Data"] = "data";
    Conference_OriginatingData_Update_Column["Id"] = "id";
    Conference_OriginatingData_Update_Column["SourceId"] = "sourceId";
    Conference_OriginatingData_Update_Column["SubconferenceId"] = "subconferenceId";
    Conference_OriginatingData_Update_Column["UpdatedAt"] = "updatedAt";
})(Conference_OriginatingData_Update_Column = exports.Conference_OriginatingData_Update_Column || (exports.Conference_OriginatingData_Update_Column = {}));
var Conference_Subconference_Constraint;
(function (Conference_Subconference_Constraint) {
    Conference_Subconference_Constraint["SubconferenceConferenceIdNameKey"] = "Subconference_conferenceId_name_key";
    Conference_Subconference_Constraint["SubconferenceConferenceIdShortNameKey"] = "Subconference_conferenceId_shortName_key";
    Conference_Subconference_Constraint["SubconferenceConferenceIdSlugKey"] = "Subconference_conferenceId_slug_key";
    Conference_Subconference_Constraint["SubconferencePkey"] = "Subconference_pkey";
})(Conference_Subconference_Constraint = exports.Conference_Subconference_Constraint || (exports.Conference_Subconference_Constraint = {}));
var Conference_Subconference_Select_Column;
(function (Conference_Subconference_Select_Column) {
    Conference_Subconference_Select_Column["ConferenceId"] = "conferenceId";
    Conference_Subconference_Select_Column["ConferenceVisibilityLevel"] = "conferenceVisibilityLevel";
    Conference_Subconference_Select_Column["CreatedAt"] = "created_at";
    Conference_Subconference_Select_Column["DefaultProgramVisibilityLevel"] = "defaultProgramVisibilityLevel";
    Conference_Subconference_Select_Column["Id"] = "id";
    Conference_Subconference_Select_Column["Name"] = "name";
    Conference_Subconference_Select_Column["ShortName"] = "shortName";
    Conference_Subconference_Select_Column["Slug"] = "slug";
    Conference_Subconference_Select_Column["UpdatedAt"] = "updated_at";
})(Conference_Subconference_Select_Column = exports.Conference_Subconference_Select_Column || (exports.Conference_Subconference_Select_Column = {}));
var Conference_Subconference_Update_Column;
(function (Conference_Subconference_Update_Column) {
    Conference_Subconference_Update_Column["ConferenceId"] = "conferenceId";
    Conference_Subconference_Update_Column["ConferenceVisibilityLevel"] = "conferenceVisibilityLevel";
    Conference_Subconference_Update_Column["CreatedAt"] = "created_at";
    Conference_Subconference_Update_Column["DefaultProgramVisibilityLevel"] = "defaultProgramVisibilityLevel";
    Conference_Subconference_Update_Column["Id"] = "id";
    Conference_Subconference_Update_Column["Name"] = "name";
    Conference_Subconference_Update_Column["ShortName"] = "shortName";
    Conference_Subconference_Update_Column["Slug"] = "slug";
    Conference_Subconference_Update_Column["UpdatedAt"] = "updated_at";
})(Conference_Subconference_Update_Column = exports.Conference_Subconference_Update_Column || (exports.Conference_Subconference_Update_Column = {}));
var Conference_VisibilityLevel_Constraint;
(function (Conference_VisibilityLevel_Constraint) {
    Conference_VisibilityLevel_Constraint["VisibilityLevelPkey"] = "VisibilityLevel_pkey";
})(Conference_VisibilityLevel_Constraint = exports.Conference_VisibilityLevel_Constraint || (exports.Conference_VisibilityLevel_Constraint = {}));
var Conference_VisibilityLevel_Enum;
(function (Conference_VisibilityLevel_Enum) {
    Conference_VisibilityLevel_Enum["External"] = "EXTERNAL";
    Conference_VisibilityLevel_Enum["Internal"] = "INTERNAL";
    Conference_VisibilityLevel_Enum["Private"] = "PRIVATE";
    Conference_VisibilityLevel_Enum["Public"] = "PUBLIC";
    Conference_VisibilityLevel_Enum["PublicOnly"] = "PUBLIC_ONLY";
})(Conference_VisibilityLevel_Enum = exports.Conference_VisibilityLevel_Enum || (exports.Conference_VisibilityLevel_Enum = {}));
var Conference_VisibilityLevel_Select_Column;
(function (Conference_VisibilityLevel_Select_Column) {
    Conference_VisibilityLevel_Select_Column["Description"] = "description";
    Conference_VisibilityLevel_Select_Column["Name"] = "name";
})(Conference_VisibilityLevel_Select_Column = exports.Conference_VisibilityLevel_Select_Column || (exports.Conference_VisibilityLevel_Select_Column = {}));
var Conference_VisibilityLevel_Update_Column;
(function (Conference_VisibilityLevel_Update_Column) {
    Conference_VisibilityLevel_Update_Column["Description"] = "description";
    Conference_VisibilityLevel_Update_Column["Name"] = "name";
})(Conference_VisibilityLevel_Update_Column = exports.Conference_VisibilityLevel_Update_Column || (exports.Conference_VisibilityLevel_Update_Column = {}));
var Content_ElementType_Constraint;
(function (Content_ElementType_Constraint) {
    Content_ElementType_Constraint["ElementTypePkey"] = "ElementType_pkey";
})(Content_ElementType_Constraint = exports.Content_ElementType_Constraint || (exports.Content_ElementType_Constraint = {}));
var Content_ElementType_Enum;
(function (Content_ElementType_Enum) {
    Content_ElementType_Enum["Abstract"] = "ABSTRACT";
    Content_ElementType_Enum["ActiveSocialRooms"] = "ACTIVE_SOCIAL_ROOMS";
    Content_ElementType_Enum["AudioFile"] = "AUDIO_FILE";
    Content_ElementType_Enum["AudioLink"] = "AUDIO_LINK";
    Content_ElementType_Enum["AudioUrl"] = "AUDIO_URL";
    Content_ElementType_Enum["ContentGroupList"] = "CONTENT_GROUP_LIST";
    Content_ElementType_Enum["Divider"] = "DIVIDER";
    Content_ElementType_Enum["ExploreProgramButton"] = "EXPLORE_PROGRAM_BUTTON";
    Content_ElementType_Enum["ExploreScheduleButton"] = "EXPLORE_SCHEDULE_BUTTON";
    Content_ElementType_Enum["ImageFile"] = "IMAGE_FILE";
    Content_ElementType_Enum["ImageUrl"] = "IMAGE_URL";
    Content_ElementType_Enum["Link"] = "LINK";
    Content_ElementType_Enum["LinkButton"] = "LINK_BUTTON";
    Content_ElementType_Enum["LiveProgramRooms"] = "LIVE_PROGRAM_ROOMS";
    Content_ElementType_Enum["PaperFile"] = "PAPER_FILE";
    Content_ElementType_Enum["PaperLink"] = "PAPER_LINK";
    Content_ElementType_Enum["PaperUrl"] = "PAPER_URL";
    Content_ElementType_Enum["PosterFile"] = "POSTER_FILE";
    Content_ElementType_Enum["PosterUrl"] = "POSTER_URL";
    Content_ElementType_Enum["SponsorBooths"] = "SPONSOR_BOOTHS";
    Content_ElementType_Enum["Text"] = "TEXT";
    Content_ElementType_Enum["VideoBroadcast"] = "VIDEO_BROADCAST";
    Content_ElementType_Enum["VideoCountdown"] = "VIDEO_COUNTDOWN";
    Content_ElementType_Enum["VideoFile"] = "VIDEO_FILE";
    Content_ElementType_Enum["VideoFiller"] = "VIDEO_FILLER";
    Content_ElementType_Enum["VideoLink"] = "VIDEO_LINK";
    Content_ElementType_Enum["VideoPrepublish"] = "VIDEO_PREPUBLISH";
    Content_ElementType_Enum["VideoSponsorsFiller"] = "VIDEO_SPONSORS_FILLER";
    Content_ElementType_Enum["VideoTitles"] = "VIDEO_TITLES";
    Content_ElementType_Enum["VideoUrl"] = "VIDEO_URL";
    Content_ElementType_Enum["WholeSchedule"] = "WHOLE_SCHEDULE";
    Content_ElementType_Enum["Zoom"] = "ZOOM";
})(Content_ElementType_Enum = exports.Content_ElementType_Enum || (exports.Content_ElementType_Enum = {}));
var Content_ElementType_Select_Column;
(function (Content_ElementType_Select_Column) {
    Content_ElementType_Select_Column["Description"] = "description";
    Content_ElementType_Select_Column["Name"] = "name";
})(Content_ElementType_Select_Column = exports.Content_ElementType_Select_Column || (exports.Content_ElementType_Select_Column = {}));
var Content_ElementType_Update_Column;
(function (Content_ElementType_Update_Column) {
    Content_ElementType_Update_Column["Description"] = "description";
    Content_ElementType_Update_Column["Name"] = "name";
})(Content_ElementType_Update_Column = exports.Content_ElementType_Update_Column || (exports.Content_ElementType_Update_Column = {}));
var Content_Element_Constraint;
(function (Content_Element_Constraint) {
    Content_Element_Constraint["ElementPkey"] = "Element_pkey";
})(Content_Element_Constraint = exports.Content_Element_Constraint || (exports.Content_Element_Constraint = {}));
var Content_Element_Select_Column;
(function (Content_Element_Select_Column) {
    Content_Element_Select_Column["ConferenceId"] = "conferenceId";
    Content_Element_Select_Column["CreatedAt"] = "createdAt";
    Content_Element_Select_Column["Data"] = "data";
    Content_Element_Select_Column["Id"] = "id";
    Content_Element_Select_Column["IsHidden"] = "isHidden";
    Content_Element_Select_Column["ItemId"] = "itemId";
    Content_Element_Select_Column["LayoutData"] = "layoutData";
    Content_Element_Select_Column["Name"] = "name";
    Content_Element_Select_Column["OriginatingDataId"] = "originatingDataId";
    Content_Element_Select_Column["SubconferenceId"] = "subconferenceId";
    Content_Element_Select_Column["TypeName"] = "typeName";
    Content_Element_Select_Column["UpdatedAt"] = "updatedAt";
    Content_Element_Select_Column["UploadsRemaining"] = "uploadsRemaining";
    Content_Element_Select_Column["VisibilityLevel"] = "visibilityLevel";
})(Content_Element_Select_Column = exports.Content_Element_Select_Column || (exports.Content_Element_Select_Column = {}));
var Content_Element_Update_Column;
(function (Content_Element_Update_Column) {
    Content_Element_Update_Column["ConferenceId"] = "conferenceId";
    Content_Element_Update_Column["CreatedAt"] = "createdAt";
    Content_Element_Update_Column["Data"] = "data";
    Content_Element_Update_Column["Id"] = "id";
    Content_Element_Update_Column["IsHidden"] = "isHidden";
    Content_Element_Update_Column["ItemId"] = "itemId";
    Content_Element_Update_Column["LayoutData"] = "layoutData";
    Content_Element_Update_Column["Name"] = "name";
    Content_Element_Update_Column["OriginatingDataId"] = "originatingDataId";
    Content_Element_Update_Column["SubconferenceId"] = "subconferenceId";
    Content_Element_Update_Column["TypeName"] = "typeName";
    Content_Element_Update_Column["UpdatedAt"] = "updatedAt";
    Content_Element_Update_Column["UploadsRemaining"] = "uploadsRemaining";
    Content_Element_Update_Column["VisibilityLevel"] = "visibilityLevel";
})(Content_Element_Update_Column = exports.Content_Element_Update_Column || (exports.Content_Element_Update_Column = {}));
var Content_ItemExhibition_Constraint;
(function (Content_ItemExhibition_Constraint) {
    Content_ItemExhibition_Constraint["ItemExhibitionPkey"] = "ItemExhibition_pkey";
})(Content_ItemExhibition_Constraint = exports.Content_ItemExhibition_Constraint || (exports.Content_ItemExhibition_Constraint = {}));
var Content_ItemExhibition_Select_Column;
(function (Content_ItemExhibition_Select_Column) {
    Content_ItemExhibition_Select_Column["ExhibitionId"] = "exhibitionId";
    Content_ItemExhibition_Select_Column["Id"] = "id";
    Content_ItemExhibition_Select_Column["ItemId"] = "itemId";
    Content_ItemExhibition_Select_Column["Layout"] = "layout";
    Content_ItemExhibition_Select_Column["Priority"] = "priority";
})(Content_ItemExhibition_Select_Column = exports.Content_ItemExhibition_Select_Column || (exports.Content_ItemExhibition_Select_Column = {}));
var Content_ItemExhibition_Update_Column;
(function (Content_ItemExhibition_Update_Column) {
    Content_ItemExhibition_Update_Column["ExhibitionId"] = "exhibitionId";
    Content_ItemExhibition_Update_Column["Id"] = "id";
    Content_ItemExhibition_Update_Column["ItemId"] = "itemId";
    Content_ItemExhibition_Update_Column["Layout"] = "layout";
    Content_ItemExhibition_Update_Column["Priority"] = "priority";
})(Content_ItemExhibition_Update_Column = exports.Content_ItemExhibition_Update_Column || (exports.Content_ItemExhibition_Update_Column = {}));
var Content_ItemProgramPerson_Constraint;
(function (Content_ItemProgramPerson_Constraint) {
    Content_ItemProgramPerson_Constraint["ItemProgramPersonPkey"] = "ItemProgramPerson_pkey";
    Content_ItemProgramPerson_Constraint["ItemProgramPersonRoleNamePersonIdItemIdKey"] = "ItemProgramPerson_roleName_personId_itemId_key";
})(Content_ItemProgramPerson_Constraint = exports.Content_ItemProgramPerson_Constraint || (exports.Content_ItemProgramPerson_Constraint = {}));
var Content_ItemProgramPerson_Select_Column;
(function (Content_ItemProgramPerson_Select_Column) {
    Content_ItemProgramPerson_Select_Column["Id"] = "id";
    Content_ItemProgramPerson_Select_Column["ItemId"] = "itemId";
    Content_ItemProgramPerson_Select_Column["PersonId"] = "personId";
    Content_ItemProgramPerson_Select_Column["Priority"] = "priority";
    Content_ItemProgramPerson_Select_Column["RoleName"] = "roleName";
})(Content_ItemProgramPerson_Select_Column = exports.Content_ItemProgramPerson_Select_Column || (exports.Content_ItemProgramPerson_Select_Column = {}));
var Content_ItemProgramPerson_Update_Column;
(function (Content_ItemProgramPerson_Update_Column) {
    Content_ItemProgramPerson_Update_Column["Id"] = "id";
    Content_ItemProgramPerson_Update_Column["ItemId"] = "itemId";
    Content_ItemProgramPerson_Update_Column["PersonId"] = "personId";
    Content_ItemProgramPerson_Update_Column["Priority"] = "priority";
    Content_ItemProgramPerson_Update_Column["RoleName"] = "roleName";
})(Content_ItemProgramPerson_Update_Column = exports.Content_ItemProgramPerson_Update_Column || (exports.Content_ItemProgramPerson_Update_Column = {}));
var Content_ItemTag_Constraint;
(function (Content_ItemTag_Constraint) {
    Content_ItemTag_Constraint["ItemTagItemIdTagIdKey"] = "ItemTag_itemId_tagId_key";
    Content_ItemTag_Constraint["ItemTagPkey"] = "ItemTag_pkey";
})(Content_ItemTag_Constraint = exports.Content_ItemTag_Constraint || (exports.Content_ItemTag_Constraint = {}));
var Content_ItemTag_Select_Column;
(function (Content_ItemTag_Select_Column) {
    Content_ItemTag_Select_Column["Id"] = "id";
    Content_ItemTag_Select_Column["ItemId"] = "itemId";
    Content_ItemTag_Select_Column["TagId"] = "tagId";
})(Content_ItemTag_Select_Column = exports.Content_ItemTag_Select_Column || (exports.Content_ItemTag_Select_Column = {}));
var Content_ItemTag_Update_Column;
(function (Content_ItemTag_Update_Column) {
    Content_ItemTag_Update_Column["Id"] = "id";
    Content_ItemTag_Update_Column["ItemId"] = "itemId";
    Content_ItemTag_Update_Column["TagId"] = "tagId";
})(Content_ItemTag_Update_Column = exports.Content_ItemTag_Update_Column || (exports.Content_ItemTag_Update_Column = {}));
var Content_ItemType_Constraint;
(function (Content_ItemType_Constraint) {
    Content_ItemType_Constraint["ItemTypePkey"] = "ItemType_pkey";
})(Content_ItemType_Constraint = exports.Content_ItemType_Constraint || (exports.Content_ItemType_Constraint = {}));
var Content_ItemType_Enum;
(function (Content_ItemType_Enum) {
    Content_ItemType_Enum["Demonstration"] = "DEMONSTRATION";
    Content_ItemType_Enum["Keynote"] = "KEYNOTE";
    Content_ItemType_Enum["LandingPage"] = "LANDING_PAGE";
    Content_ItemType_Enum["Other"] = "OTHER";
    Content_ItemType_Enum["Paper"] = "PAPER";
    Content_ItemType_Enum["Poster"] = "POSTER";
    Content_ItemType_Enum["Presentation"] = "PRESENTATION";
    Content_ItemType_Enum["Session"] = "SESSION";
    Content_ItemType_Enum["SessionQAndA"] = "SESSION_Q_AND_A";
    Content_ItemType_Enum["Social"] = "SOCIAL";
    Content_ItemType_Enum["Sponsor"] = "SPONSOR";
    Content_ItemType_Enum["SwagBag"] = "SWAG_BAG";
    Content_ItemType_Enum["Symposium"] = "SYMPOSIUM";
    Content_ItemType_Enum["Tutorial"] = "TUTORIAL";
    Content_ItemType_Enum["Workshop"] = "WORKSHOP";
})(Content_ItemType_Enum = exports.Content_ItemType_Enum || (exports.Content_ItemType_Enum = {}));
var Content_ItemType_Select_Column;
(function (Content_ItemType_Select_Column) {
    Content_ItemType_Select_Column["Description"] = "description";
    Content_ItemType_Select_Column["Name"] = "name";
})(Content_ItemType_Select_Column = exports.Content_ItemType_Select_Column || (exports.Content_ItemType_Select_Column = {}));
var Content_ItemType_Update_Column;
(function (Content_ItemType_Update_Column) {
    Content_ItemType_Update_Column["Description"] = "description";
    Content_ItemType_Update_Column["Name"] = "name";
})(Content_ItemType_Update_Column = exports.Content_ItemType_Update_Column || (exports.Content_ItemType_Update_Column = {}));
var Content_Item_Constraint;
(function (Content_Item_Constraint) {
    Content_Item_Constraint["ItemPkey"] = "Item_pkey";
})(Content_Item_Constraint = exports.Content_Item_Constraint || (exports.Content_Item_Constraint = {}));
var Content_Item_Select_Column;
(function (Content_Item_Select_Column) {
    Content_Item_Select_Column["ChatId"] = "chatId";
    Content_Item_Select_Column["ConferenceId"] = "conferenceId";
    Content_Item_Select_Column["CreatedAt"] = "createdAt";
    Content_Item_Select_Column["Id"] = "id";
    Content_Item_Select_Column["OriginatingDataId"] = "originatingDataId";
    Content_Item_Select_Column["ShortTitle"] = "shortTitle";
    Content_Item_Select_Column["SubconferenceId"] = "subconferenceId";
    Content_Item_Select_Column["Title"] = "title";
    Content_Item_Select_Column["TypeName"] = "typeName";
    Content_Item_Select_Column["UpdatedAt"] = "updatedAt";
    Content_Item_Select_Column["VisibilityLevel"] = "visibilityLevel";
})(Content_Item_Select_Column = exports.Content_Item_Select_Column || (exports.Content_Item_Select_Column = {}));
var Content_Item_Update_Column;
(function (Content_Item_Update_Column) {
    Content_Item_Update_Column["ChatId"] = "chatId";
    Content_Item_Update_Column["ConferenceId"] = "conferenceId";
    Content_Item_Update_Column["CreatedAt"] = "createdAt";
    Content_Item_Update_Column["Id"] = "id";
    Content_Item_Update_Column["OriginatingDataId"] = "originatingDataId";
    Content_Item_Update_Column["ShortTitle"] = "shortTitle";
    Content_Item_Update_Column["SubconferenceId"] = "subconferenceId";
    Content_Item_Update_Column["Title"] = "title";
    Content_Item_Update_Column["TypeName"] = "typeName";
    Content_Item_Update_Column["UpdatedAt"] = "updatedAt";
    Content_Item_Update_Column["VisibilityLevel"] = "visibilityLevel";
})(Content_Item_Update_Column = exports.Content_Item_Update_Column || (exports.Content_Item_Update_Column = {}));
var Job_Queues_ChannelStackCreateJob_Constraint;
(function (Job_Queues_ChannelStackCreateJob_Constraint) {
    Job_Queues_ChannelStackCreateJob_Constraint["ChannelStackCreateJobPkey"] = "ChannelStackCreateJob_pkey";
    Job_Queues_ChannelStackCreateJob_Constraint["ChannelStackCreateJobStackLogicalResourceIdKey"] = "ChannelStackCreateJob_stackLogicalResourceId_key";
})(Job_Queues_ChannelStackCreateJob_Constraint = exports.Job_Queues_ChannelStackCreateJob_Constraint || (exports.Job_Queues_ChannelStackCreateJob_Constraint = {}));
var Job_Queues_ChannelStackCreateJob_Select_Column;
(function (Job_Queues_ChannelStackCreateJob_Select_Column) {
    Job_Queues_ChannelStackCreateJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_ChannelStackCreateJob_Select_Column["CreatedAt"] = "created_at";
    Job_Queues_ChannelStackCreateJob_Select_Column["Id"] = "id";
    Job_Queues_ChannelStackCreateJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_ChannelStackCreateJob_Select_Column["Message"] = "message";
    Job_Queues_ChannelStackCreateJob_Select_Column["RoomId"] = "roomId";
    Job_Queues_ChannelStackCreateJob_Select_Column["StackLogicalResourceId"] = "stackLogicalResourceId";
    Job_Queues_ChannelStackCreateJob_Select_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_ChannelStackCreateJob_Select_Column = exports.Job_Queues_ChannelStackCreateJob_Select_Column || (exports.Job_Queues_ChannelStackCreateJob_Select_Column = {}));
var Job_Queues_ChannelStackCreateJob_Update_Column;
(function (Job_Queues_ChannelStackCreateJob_Update_Column) {
    Job_Queues_ChannelStackCreateJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_ChannelStackCreateJob_Update_Column["CreatedAt"] = "created_at";
    Job_Queues_ChannelStackCreateJob_Update_Column["Id"] = "id";
    Job_Queues_ChannelStackCreateJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_ChannelStackCreateJob_Update_Column["Message"] = "message";
    Job_Queues_ChannelStackCreateJob_Update_Column["RoomId"] = "roomId";
    Job_Queues_ChannelStackCreateJob_Update_Column["StackLogicalResourceId"] = "stackLogicalResourceId";
    Job_Queues_ChannelStackCreateJob_Update_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_ChannelStackCreateJob_Update_Column = exports.Job_Queues_ChannelStackCreateJob_Update_Column || (exports.Job_Queues_ChannelStackCreateJob_Update_Column = {}));
var Job_Queues_ChannelStackDeleteJob_Constraint;
(function (Job_Queues_ChannelStackDeleteJob_Constraint) {
    Job_Queues_ChannelStackDeleteJob_Constraint["ChannelStackDeleteJobPkey"] = "ChannelStackDeleteJob_pkey";
})(Job_Queues_ChannelStackDeleteJob_Constraint = exports.Job_Queues_ChannelStackDeleteJob_Constraint || (exports.Job_Queues_ChannelStackDeleteJob_Constraint = {}));
var Job_Queues_ChannelStackDeleteJob_Select_Column;
(function (Job_Queues_ChannelStackDeleteJob_Select_Column) {
    Job_Queues_ChannelStackDeleteJob_Select_Column["CloudFormationStackArn"] = "cloudFormationStackArn";
    Job_Queues_ChannelStackDeleteJob_Select_Column["CreatedAt"] = "createdAt";
    Job_Queues_ChannelStackDeleteJob_Select_Column["Id"] = "id";
    Job_Queues_ChannelStackDeleteJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_ChannelStackDeleteJob_Select_Column["MediaLiveChannelId"] = "mediaLiveChannelId";
    Job_Queues_ChannelStackDeleteJob_Select_Column["Message"] = "message";
    Job_Queues_ChannelStackDeleteJob_Select_Column["UpdatedAt"] = "updatedAt";
})(Job_Queues_ChannelStackDeleteJob_Select_Column = exports.Job_Queues_ChannelStackDeleteJob_Select_Column || (exports.Job_Queues_ChannelStackDeleteJob_Select_Column = {}));
var Job_Queues_ChannelStackDeleteJob_Update_Column;
(function (Job_Queues_ChannelStackDeleteJob_Update_Column) {
    Job_Queues_ChannelStackDeleteJob_Update_Column["CloudFormationStackArn"] = "cloudFormationStackArn";
    Job_Queues_ChannelStackDeleteJob_Update_Column["CreatedAt"] = "createdAt";
    Job_Queues_ChannelStackDeleteJob_Update_Column["Id"] = "id";
    Job_Queues_ChannelStackDeleteJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_ChannelStackDeleteJob_Update_Column["MediaLiveChannelId"] = "mediaLiveChannelId";
    Job_Queues_ChannelStackDeleteJob_Update_Column["Message"] = "message";
    Job_Queues_ChannelStackDeleteJob_Update_Column["UpdatedAt"] = "updatedAt";
})(Job_Queues_ChannelStackDeleteJob_Update_Column = exports.Job_Queues_ChannelStackDeleteJob_Update_Column || (exports.Job_Queues_ChannelStackDeleteJob_Update_Column = {}));
var Job_Queues_ChannelStackUpdateJob_Constraint;
(function (Job_Queues_ChannelStackUpdateJob_Constraint) {
    Job_Queues_ChannelStackUpdateJob_Constraint["ChannelStackUpdateJobPkey"] = "ChannelStackUpdateJob_pkey";
})(Job_Queues_ChannelStackUpdateJob_Constraint = exports.Job_Queues_ChannelStackUpdateJob_Constraint || (exports.Job_Queues_ChannelStackUpdateJob_Constraint = {}));
var Job_Queues_ChannelStackUpdateJob_Select_Column;
(function (Job_Queues_ChannelStackUpdateJob_Select_Column) {
    Job_Queues_ChannelStackUpdateJob_Select_Column["ChannelStackId"] = "channelStackId";
    Job_Queues_ChannelStackUpdateJob_Select_Column["CloudFormationStackArn"] = "cloudFormationStackArn";
    Job_Queues_ChannelStackUpdateJob_Select_Column["CreatedAt"] = "created_at";
    Job_Queues_ChannelStackUpdateJob_Select_Column["Id"] = "id";
    Job_Queues_ChannelStackUpdateJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_ChannelStackUpdateJob_Select_Column["MediaLiveChannelId"] = "mediaLiveChannelId";
    Job_Queues_ChannelStackUpdateJob_Select_Column["Message"] = "message";
    Job_Queues_ChannelStackUpdateJob_Select_Column["NewRtmpOutputStreamKey"] = "newRtmpOutputStreamKey";
    Job_Queues_ChannelStackUpdateJob_Select_Column["NewRtmpOutputUri"] = "newRtmpOutputUri";
    Job_Queues_ChannelStackUpdateJob_Select_Column["OldRtmpOutputDestinationId"] = "oldRtmpOutputDestinationId";
    Job_Queues_ChannelStackUpdateJob_Select_Column["OldRtmpOutputStreamKey"] = "oldRtmpOutputStreamKey";
    Job_Queues_ChannelStackUpdateJob_Select_Column["OldRtmpOutputUri"] = "oldRtmpOutputUri";
    Job_Queues_ChannelStackUpdateJob_Select_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_ChannelStackUpdateJob_Select_Column = exports.Job_Queues_ChannelStackUpdateJob_Select_Column || (exports.Job_Queues_ChannelStackUpdateJob_Select_Column = {}));
var Job_Queues_ChannelStackUpdateJob_Update_Column;
(function (Job_Queues_ChannelStackUpdateJob_Update_Column) {
    Job_Queues_ChannelStackUpdateJob_Update_Column["ChannelStackId"] = "channelStackId";
    Job_Queues_ChannelStackUpdateJob_Update_Column["CloudFormationStackArn"] = "cloudFormationStackArn";
    Job_Queues_ChannelStackUpdateJob_Update_Column["CreatedAt"] = "created_at";
    Job_Queues_ChannelStackUpdateJob_Update_Column["Id"] = "id";
    Job_Queues_ChannelStackUpdateJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_ChannelStackUpdateJob_Update_Column["MediaLiveChannelId"] = "mediaLiveChannelId";
    Job_Queues_ChannelStackUpdateJob_Update_Column["Message"] = "message";
    Job_Queues_ChannelStackUpdateJob_Update_Column["NewRtmpOutputStreamKey"] = "newRtmpOutputStreamKey";
    Job_Queues_ChannelStackUpdateJob_Update_Column["NewRtmpOutputUri"] = "newRtmpOutputUri";
    Job_Queues_ChannelStackUpdateJob_Update_Column["OldRtmpOutputDestinationId"] = "oldRtmpOutputDestinationId";
    Job_Queues_ChannelStackUpdateJob_Update_Column["OldRtmpOutputStreamKey"] = "oldRtmpOutputStreamKey";
    Job_Queues_ChannelStackUpdateJob_Update_Column["OldRtmpOutputUri"] = "oldRtmpOutputUri";
    Job_Queues_ChannelStackUpdateJob_Update_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_ChannelStackUpdateJob_Update_Column = exports.Job_Queues_ChannelStackUpdateJob_Update_Column || (exports.Job_Queues_ChannelStackUpdateJob_Update_Column = {}));
var Job_Queues_CombineVideosJob_Constraint;
(function (Job_Queues_CombineVideosJob_Constraint) {
    Job_Queues_CombineVideosJob_Constraint["CombineVideosJobPkey"] = "CombineVideosJob_pkey";
})(Job_Queues_CombineVideosJob_Constraint = exports.Job_Queues_CombineVideosJob_Constraint || (exports.Job_Queues_CombineVideosJob_Constraint = {}));
var Job_Queues_CombineVideosJob_Select_Column;
(function (Job_Queues_CombineVideosJob_Select_Column) {
    Job_Queues_CombineVideosJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_CombineVideosJob_Select_Column["CreatedByRegistrantId"] = "createdByRegistrantId";
    Job_Queues_CombineVideosJob_Select_Column["CreatedAt"] = "created_at";
    Job_Queues_CombineVideosJob_Select_Column["Data"] = "data";
    Job_Queues_CombineVideosJob_Select_Column["Id"] = "id";
    Job_Queues_CombineVideosJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_CombineVideosJob_Select_Column["MediaConvertJobId"] = "mediaConvertJobId";
    Job_Queues_CombineVideosJob_Select_Column["Message"] = "message";
    Job_Queues_CombineVideosJob_Select_Column["OutputName"] = "outputName";
    Job_Queues_CombineVideosJob_Select_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_CombineVideosJob_Select_Column = exports.Job_Queues_CombineVideosJob_Select_Column || (exports.Job_Queues_CombineVideosJob_Select_Column = {}));
var Job_Queues_CombineVideosJob_Update_Column;
(function (Job_Queues_CombineVideosJob_Update_Column) {
    Job_Queues_CombineVideosJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_CombineVideosJob_Update_Column["CreatedByRegistrantId"] = "createdByRegistrantId";
    Job_Queues_CombineVideosJob_Update_Column["CreatedAt"] = "created_at";
    Job_Queues_CombineVideosJob_Update_Column["Data"] = "data";
    Job_Queues_CombineVideosJob_Update_Column["Id"] = "id";
    Job_Queues_CombineVideosJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_CombineVideosJob_Update_Column["MediaConvertJobId"] = "mediaConvertJobId";
    Job_Queues_CombineVideosJob_Update_Column["Message"] = "message";
    Job_Queues_CombineVideosJob_Update_Column["OutputName"] = "outputName";
    Job_Queues_CombineVideosJob_Update_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_CombineVideosJob_Update_Column = exports.Job_Queues_CombineVideosJob_Update_Column || (exports.Job_Queues_CombineVideosJob_Update_Column = {}));
var Job_Queues_CustomEmailJob_Constraint;
(function (Job_Queues_CustomEmailJob_Constraint) {
    Job_Queues_CustomEmailJob_Constraint["CustomEmailJobPkey"] = "CustomEmailJob_pkey";
})(Job_Queues_CustomEmailJob_Constraint = exports.Job_Queues_CustomEmailJob_Constraint || (exports.Job_Queues_CustomEmailJob_Constraint = {}));
var Job_Queues_CustomEmailJob_Select_Column;
(function (Job_Queues_CustomEmailJob_Select_Column) {
    Job_Queues_CustomEmailJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_CustomEmailJob_Select_Column["CreatedAt"] = "created_at";
    Job_Queues_CustomEmailJob_Select_Column["Id"] = "id";
    Job_Queues_CustomEmailJob_Select_Column["MarkdownBody"] = "markdownBody";
    Job_Queues_CustomEmailJob_Select_Column["Processed"] = "processed";
    Job_Queues_CustomEmailJob_Select_Column["RegistrantIds"] = "registrantIds";
    Job_Queues_CustomEmailJob_Select_Column["SubconferenceId"] = "subconferenceId";
    Job_Queues_CustomEmailJob_Select_Column["Subject"] = "subject";
    Job_Queues_CustomEmailJob_Select_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_CustomEmailJob_Select_Column = exports.Job_Queues_CustomEmailJob_Select_Column || (exports.Job_Queues_CustomEmailJob_Select_Column = {}));
var Job_Queues_CustomEmailJob_Update_Column;
(function (Job_Queues_CustomEmailJob_Update_Column) {
    Job_Queues_CustomEmailJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_CustomEmailJob_Update_Column["CreatedAt"] = "created_at";
    Job_Queues_CustomEmailJob_Update_Column["Id"] = "id";
    Job_Queues_CustomEmailJob_Update_Column["MarkdownBody"] = "markdownBody";
    Job_Queues_CustomEmailJob_Update_Column["Processed"] = "processed";
    Job_Queues_CustomEmailJob_Update_Column["RegistrantIds"] = "registrantIds";
    Job_Queues_CustomEmailJob_Update_Column["SubconferenceId"] = "subconferenceId";
    Job_Queues_CustomEmailJob_Update_Column["Subject"] = "subject";
    Job_Queues_CustomEmailJob_Update_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_CustomEmailJob_Update_Column = exports.Job_Queues_CustomEmailJob_Update_Column || (exports.Job_Queues_CustomEmailJob_Update_Column = {}));
var Job_Queues_InvitationEmailJob_Constraint;
(function (Job_Queues_InvitationEmailJob_Constraint) {
    Job_Queues_InvitationEmailJob_Constraint["InvitationEmailJobsPkey"] = "InvitationEmailJobs_pkey";
})(Job_Queues_InvitationEmailJob_Constraint = exports.Job_Queues_InvitationEmailJob_Constraint || (exports.Job_Queues_InvitationEmailJob_Constraint = {}));
var Job_Queues_InvitationEmailJob_Select_Column;
(function (Job_Queues_InvitationEmailJob_Select_Column) {
    Job_Queues_InvitationEmailJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_InvitationEmailJob_Select_Column["CreatedAt"] = "createdAt";
    Job_Queues_InvitationEmailJob_Select_Column["Id"] = "id";
    Job_Queues_InvitationEmailJob_Select_Column["Processed"] = "processed";
    Job_Queues_InvitationEmailJob_Select_Column["RegistrantIds"] = "registrantIds";
    Job_Queues_InvitationEmailJob_Select_Column["SendRepeat"] = "sendRepeat";
    Job_Queues_InvitationEmailJob_Select_Column["UpdatedAt"] = "updatedAt";
})(Job_Queues_InvitationEmailJob_Select_Column = exports.Job_Queues_InvitationEmailJob_Select_Column || (exports.Job_Queues_InvitationEmailJob_Select_Column = {}));
var Job_Queues_InvitationEmailJob_Update_Column;
(function (Job_Queues_InvitationEmailJob_Update_Column) {
    Job_Queues_InvitationEmailJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_InvitationEmailJob_Update_Column["CreatedAt"] = "createdAt";
    Job_Queues_InvitationEmailJob_Update_Column["Id"] = "id";
    Job_Queues_InvitationEmailJob_Update_Column["Processed"] = "processed";
    Job_Queues_InvitationEmailJob_Update_Column["RegistrantIds"] = "registrantIds";
    Job_Queues_InvitationEmailJob_Update_Column["SendRepeat"] = "sendRepeat";
    Job_Queues_InvitationEmailJob_Update_Column["UpdatedAt"] = "updatedAt";
})(Job_Queues_InvitationEmailJob_Update_Column = exports.Job_Queues_InvitationEmailJob_Update_Column || (exports.Job_Queues_InvitationEmailJob_Update_Column = {}));
var Job_Queues_JobStatus_Constraint;
(function (Job_Queues_JobStatus_Constraint) {
    Job_Queues_JobStatus_Constraint["JobStatusPkey"] = "JobStatus_pkey";
})(Job_Queues_JobStatus_Constraint = exports.Job_Queues_JobStatus_Constraint || (exports.Job_Queues_JobStatus_Constraint = {}));
var Job_Queues_JobStatus_Enum;
(function (Job_Queues_JobStatus_Enum) {
    Job_Queues_JobStatus_Enum["Completed"] = "COMPLETED";
    Job_Queues_JobStatus_Enum["Expired"] = "EXPIRED";
    Job_Queues_JobStatus_Enum["Failed"] = "FAILED";
    Job_Queues_JobStatus_Enum["InProgress"] = "IN_PROGRESS";
    Job_Queues_JobStatus_Enum["New"] = "NEW";
})(Job_Queues_JobStatus_Enum = exports.Job_Queues_JobStatus_Enum || (exports.Job_Queues_JobStatus_Enum = {}));
var Job_Queues_JobStatus_Select_Column;
(function (Job_Queues_JobStatus_Select_Column) {
    Job_Queues_JobStatus_Select_Column["Description"] = "description";
    Job_Queues_JobStatus_Select_Column["Name"] = "name";
})(Job_Queues_JobStatus_Select_Column = exports.Job_Queues_JobStatus_Select_Column || (exports.Job_Queues_JobStatus_Select_Column = {}));
var Job_Queues_JobStatus_Update_Column;
(function (Job_Queues_JobStatus_Update_Column) {
    Job_Queues_JobStatus_Update_Column["Description"] = "description";
    Job_Queues_JobStatus_Update_Column["Name"] = "name";
})(Job_Queues_JobStatus_Update_Column = exports.Job_Queues_JobStatus_Update_Column || (exports.Job_Queues_JobStatus_Update_Column = {}));
var Job_Queues_MediaPackageHarvestJob_Constraint;
(function (Job_Queues_MediaPackageHarvestJob_Constraint) {
    Job_Queues_MediaPackageHarvestJob_Constraint["MediaPackageHarvestJobMediaPackageHarvestJobIdKey"] = "MediaPackageHarvestJob_mediaPackageHarvestJobId_key";
    Job_Queues_MediaPackageHarvestJob_Constraint["MediaPackageHarvestJobPkey"] = "MediaPackageHarvestJob_pkey";
})(Job_Queues_MediaPackageHarvestJob_Constraint = exports.Job_Queues_MediaPackageHarvestJob_Constraint || (exports.Job_Queues_MediaPackageHarvestJob_Constraint = {}));
var Job_Queues_MediaPackageHarvestJob_Select_Column;
(function (Job_Queues_MediaPackageHarvestJob_Select_Column) {
    Job_Queues_MediaPackageHarvestJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_MediaPackageHarvestJob_Select_Column["CreatedAt"] = "created_at";
    Job_Queues_MediaPackageHarvestJob_Select_Column["EventId"] = "eventId";
    Job_Queues_MediaPackageHarvestJob_Select_Column["Id"] = "id";
    Job_Queues_MediaPackageHarvestJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_MediaPackageHarvestJob_Select_Column["MediaPackageHarvestJobId"] = "mediaPackageHarvestJobId";
    Job_Queues_MediaPackageHarvestJob_Select_Column["Message"] = "message";
    Job_Queues_MediaPackageHarvestJob_Select_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_MediaPackageHarvestJob_Select_Column = exports.Job_Queues_MediaPackageHarvestJob_Select_Column || (exports.Job_Queues_MediaPackageHarvestJob_Select_Column = {}));
var Job_Queues_MediaPackageHarvestJob_Update_Column;
(function (Job_Queues_MediaPackageHarvestJob_Update_Column) {
    Job_Queues_MediaPackageHarvestJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_MediaPackageHarvestJob_Update_Column["CreatedAt"] = "created_at";
    Job_Queues_MediaPackageHarvestJob_Update_Column["EventId"] = "eventId";
    Job_Queues_MediaPackageHarvestJob_Update_Column["Id"] = "id";
    Job_Queues_MediaPackageHarvestJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_MediaPackageHarvestJob_Update_Column["MediaPackageHarvestJobId"] = "mediaPackageHarvestJobId";
    Job_Queues_MediaPackageHarvestJob_Update_Column["Message"] = "message";
    Job_Queues_MediaPackageHarvestJob_Update_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_MediaPackageHarvestJob_Update_Column = exports.Job_Queues_MediaPackageHarvestJob_Update_Column || (exports.Job_Queues_MediaPackageHarvestJob_Update_Column = {}));
var Job_Queues_PrepareJob_Constraint;
(function (Job_Queues_PrepareJob_Constraint) {
    Job_Queues_PrepareJob_Constraint["PrepareJobPkey"] = "PrepareJob_pkey";
})(Job_Queues_PrepareJob_Constraint = exports.Job_Queues_PrepareJob_Constraint || (exports.Job_Queues_PrepareJob_Constraint = {}));
var Job_Queues_PrepareJob_Select_Column;
(function (Job_Queues_PrepareJob_Select_Column) {
    Job_Queues_PrepareJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_PrepareJob_Select_Column["CreatedAt"] = "createdAt";
    Job_Queues_PrepareJob_Select_Column["Id"] = "id";
    Job_Queues_PrepareJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_PrepareJob_Select_Column["Message"] = "message";
    Job_Queues_PrepareJob_Select_Column["UpdatedAt"] = "updatedAt";
})(Job_Queues_PrepareJob_Select_Column = exports.Job_Queues_PrepareJob_Select_Column || (exports.Job_Queues_PrepareJob_Select_Column = {}));
var Job_Queues_PrepareJob_Update_Column;
(function (Job_Queues_PrepareJob_Update_Column) {
    Job_Queues_PrepareJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_PrepareJob_Update_Column["CreatedAt"] = "createdAt";
    Job_Queues_PrepareJob_Update_Column["Id"] = "id";
    Job_Queues_PrepareJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_PrepareJob_Update_Column["Message"] = "message";
    Job_Queues_PrepareJob_Update_Column["UpdatedAt"] = "updatedAt";
})(Job_Queues_PrepareJob_Update_Column = exports.Job_Queues_PrepareJob_Update_Column || (exports.Job_Queues_PrepareJob_Update_Column = {}));
var Job_Queues_PublishVideoJob_Constraint;
(function (Job_Queues_PublishVideoJob_Constraint) {
    Job_Queues_PublishVideoJob_Constraint["PublishVideoJobPkey"] = "PublishVideoJob_pkey";
})(Job_Queues_PublishVideoJob_Constraint = exports.Job_Queues_PublishVideoJob_Constraint || (exports.Job_Queues_PublishVideoJob_Constraint = {}));
var Job_Queues_PublishVideoJob_Select_Column;
(function (Job_Queues_PublishVideoJob_Select_Column) {
    Job_Queues_PublishVideoJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_PublishVideoJob_Select_Column["CreatedAt"] = "createdAt";
    Job_Queues_PublishVideoJob_Select_Column["ElementId"] = "elementId";
    Job_Queues_PublishVideoJob_Select_Column["Id"] = "id";
    Job_Queues_PublishVideoJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_PublishVideoJob_Select_Column["SubconferenceId"] = "subconferenceId";
    Job_Queues_PublishVideoJob_Select_Column["UpdatedAt"] = "updatedAt";
    Job_Queues_PublishVideoJob_Select_Column["VimeoVideoUrl"] = "vimeoVideoUrl";
})(Job_Queues_PublishVideoJob_Select_Column = exports.Job_Queues_PublishVideoJob_Select_Column || (exports.Job_Queues_PublishVideoJob_Select_Column = {}));
var Job_Queues_PublishVideoJob_Update_Column;
(function (Job_Queues_PublishVideoJob_Update_Column) {
    Job_Queues_PublishVideoJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_PublishVideoJob_Update_Column["CreatedAt"] = "createdAt";
    Job_Queues_PublishVideoJob_Update_Column["ElementId"] = "elementId";
    Job_Queues_PublishVideoJob_Update_Column["Id"] = "id";
    Job_Queues_PublishVideoJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_PublishVideoJob_Update_Column["SubconferenceId"] = "subconferenceId";
    Job_Queues_PublishVideoJob_Update_Column["UpdatedAt"] = "updatedAt";
    Job_Queues_PublishVideoJob_Update_Column["VimeoVideoUrl"] = "vimeoVideoUrl";
})(Job_Queues_PublishVideoJob_Update_Column = exports.Job_Queues_PublishVideoJob_Update_Column || (exports.Job_Queues_PublishVideoJob_Update_Column = {}));
var Job_Queues_SubmissionRequestEmailJob_Constraint;
(function (Job_Queues_SubmissionRequestEmailJob_Constraint) {
    Job_Queues_SubmissionRequestEmailJob_Constraint["SubmissionRequestEmailJobPkey"] = "SubmissionRequestEmailJob_pkey";
})(Job_Queues_SubmissionRequestEmailJob_Constraint = exports.Job_Queues_SubmissionRequestEmailJob_Constraint || (exports.Job_Queues_SubmissionRequestEmailJob_Constraint = {}));
var Job_Queues_SubmissionRequestEmailJob_Select_Column;
(function (Job_Queues_SubmissionRequestEmailJob_Select_Column) {
    Job_Queues_SubmissionRequestEmailJob_Select_Column["CreatedAt"] = "created_at";
    Job_Queues_SubmissionRequestEmailJob_Select_Column["EmailTemplate"] = "emailTemplate";
    Job_Queues_SubmissionRequestEmailJob_Select_Column["Id"] = "id";
    Job_Queues_SubmissionRequestEmailJob_Select_Column["PersonId"] = "personId";
    Job_Queues_SubmissionRequestEmailJob_Select_Column["Processed"] = "processed";
    Job_Queues_SubmissionRequestEmailJob_Select_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_SubmissionRequestEmailJob_Select_Column = exports.Job_Queues_SubmissionRequestEmailJob_Select_Column || (exports.Job_Queues_SubmissionRequestEmailJob_Select_Column = {}));
var Job_Queues_SubmissionRequestEmailJob_Update_Column;
(function (Job_Queues_SubmissionRequestEmailJob_Update_Column) {
    Job_Queues_SubmissionRequestEmailJob_Update_Column["CreatedAt"] = "created_at";
    Job_Queues_SubmissionRequestEmailJob_Update_Column["EmailTemplate"] = "emailTemplate";
    Job_Queues_SubmissionRequestEmailJob_Update_Column["Id"] = "id";
    Job_Queues_SubmissionRequestEmailJob_Update_Column["PersonId"] = "personId";
    Job_Queues_SubmissionRequestEmailJob_Update_Column["Processed"] = "processed";
    Job_Queues_SubmissionRequestEmailJob_Update_Column["UpdatedAt"] = "updated_at";
})(Job_Queues_SubmissionRequestEmailJob_Update_Column = exports.Job_Queues_SubmissionRequestEmailJob_Update_Column || (exports.Job_Queues_SubmissionRequestEmailJob_Update_Column = {}));
var Job_Queues_UploadYouTubeVideoJob_Constraint;
(function (Job_Queues_UploadYouTubeVideoJob_Constraint) {
    Job_Queues_UploadYouTubeVideoJob_Constraint["UploadYouTubeVideoJobPkey"] = "UploadYouTubeVideoJob_pkey";
})(Job_Queues_UploadYouTubeVideoJob_Constraint = exports.Job_Queues_UploadYouTubeVideoJob_Constraint || (exports.Job_Queues_UploadYouTubeVideoJob_Constraint = {}));
var Job_Queues_UploadYouTubeVideoJob_Select_Column;
(function (Job_Queues_UploadYouTubeVideoJob_Select_Column) {
    Job_Queues_UploadYouTubeVideoJob_Select_Column["ConferenceId"] = "conferenceId";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["CreatedAt"] = "createdAt";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["ElementId"] = "elementId";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["Id"] = "id";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["Message"] = "message";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["PlaylistId"] = "playlistId";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["RegistrantGoogleAccountId"] = "registrantGoogleAccountId";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["RetriesCount"] = "retriesCount";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["SubconferenceId"] = "subconferenceId";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["UpdatedAt"] = "updatedAt";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["VideoDescription"] = "videoDescription";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["VideoPrivacyStatus"] = "videoPrivacyStatus";
    Job_Queues_UploadYouTubeVideoJob_Select_Column["VideoTitle"] = "videoTitle";
})(Job_Queues_UploadYouTubeVideoJob_Select_Column = exports.Job_Queues_UploadYouTubeVideoJob_Select_Column || (exports.Job_Queues_UploadYouTubeVideoJob_Select_Column = {}));
var Job_Queues_UploadYouTubeVideoJob_Update_Column;
(function (Job_Queues_UploadYouTubeVideoJob_Update_Column) {
    Job_Queues_UploadYouTubeVideoJob_Update_Column["ConferenceId"] = "conferenceId";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["CreatedAt"] = "createdAt";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["ElementId"] = "elementId";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["Id"] = "id";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["JobStatusName"] = "jobStatusName";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["Message"] = "message";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["PlaylistId"] = "playlistId";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["RegistrantGoogleAccountId"] = "registrantGoogleAccountId";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["RetriesCount"] = "retriesCount";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["SubconferenceId"] = "subconferenceId";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["UpdatedAt"] = "updatedAt";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["VideoDescription"] = "videoDescription";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["VideoPrivacyStatus"] = "videoPrivacyStatus";
    Job_Queues_UploadYouTubeVideoJob_Update_Column["VideoTitle"] = "videoTitle";
})(Job_Queues_UploadYouTubeVideoJob_Update_Column = exports.Job_Queues_UploadYouTubeVideoJob_Update_Column || (exports.Job_Queues_UploadYouTubeVideoJob_Update_Column = {}));
var Order_By;
(function (Order_By) {
    Order_By["Asc"] = "asc";
    Order_By["AscNullsFirst"] = "asc_nulls_first";
    Order_By["AscNullsLast"] = "asc_nulls_last";
    Order_By["Desc"] = "desc";
    Order_By["DescNullsFirst"] = "desc_nulls_first";
    Order_By["DescNullsLast"] = "desc_nulls_last";
})(Order_By = exports.Order_By || (exports.Order_By = {}));
var Registrant_GoogleAccount_Constraint;
(function (Registrant_GoogleAccount_Constraint) {
    Registrant_GoogleAccount_Constraint["GoogleAccountPkey"] = "GoogleAccount_pkey";
    Registrant_GoogleAccount_Constraint["GoogleAccountRegistrantIdGoogleAccountEmailKey"] = "GoogleAccount_registrantId_googleAccountEmail_key";
})(Registrant_GoogleAccount_Constraint = exports.Registrant_GoogleAccount_Constraint || (exports.Registrant_GoogleAccount_Constraint = {}));
var Registrant_GoogleAccount_Select_Column;
(function (Registrant_GoogleAccount_Select_Column) {
    Registrant_GoogleAccount_Select_Column["ConferenceId"] = "conferenceId";
    Registrant_GoogleAccount_Select_Column["CreatedAt"] = "createdAt";
    Registrant_GoogleAccount_Select_Column["GoogleAccountEmail"] = "googleAccountEmail";
    Registrant_GoogleAccount_Select_Column["Id"] = "id";
    Registrant_GoogleAccount_Select_Column["RegistrantId"] = "registrantId";
    Registrant_GoogleAccount_Select_Column["TokenData"] = "tokenData";
    Registrant_GoogleAccount_Select_Column["UpdatedAt"] = "updatedAt";
    Registrant_GoogleAccount_Select_Column["YouTubeData"] = "youTubeData";
})(Registrant_GoogleAccount_Select_Column = exports.Registrant_GoogleAccount_Select_Column || (exports.Registrant_GoogleAccount_Select_Column = {}));
var Registrant_GoogleAccount_Update_Column;
(function (Registrant_GoogleAccount_Update_Column) {
    Registrant_GoogleAccount_Update_Column["ConferenceId"] = "conferenceId";
    Registrant_GoogleAccount_Update_Column["CreatedAt"] = "createdAt";
    Registrant_GoogleAccount_Update_Column["GoogleAccountEmail"] = "googleAccountEmail";
    Registrant_GoogleAccount_Update_Column["Id"] = "id";
    Registrant_GoogleAccount_Update_Column["RegistrantId"] = "registrantId";
    Registrant_GoogleAccount_Update_Column["TokenData"] = "tokenData";
    Registrant_GoogleAccount_Update_Column["UpdatedAt"] = "updatedAt";
    Registrant_GoogleAccount_Update_Column["YouTubeData"] = "youTubeData";
})(Registrant_GoogleAccount_Update_Column = exports.Registrant_GoogleAccount_Update_Column || (exports.Registrant_GoogleAccount_Update_Column = {}));
var Registrant_Invitation_Constraint;
(function (Registrant_Invitation_Constraint) {
    Registrant_Invitation_Constraint["InvitationConfirmationCodeKey"] = "Invitation_confirmationCode_key";
    Registrant_Invitation_Constraint["InvitationInviteCodeKey"] = "Invitation_inviteCode_key";
    Registrant_Invitation_Constraint["InvitationInvitedEmailAddressConferenceIdKey"] = "Invitation_invitedEmailAddress_conferenceId_key";
    Registrant_Invitation_Constraint["InvitationPkey"] = "Invitation_pkey";
    Registrant_Invitation_Constraint["InvitationRegistrantIdKey"] = "Invitation_registrantId_key";
})(Registrant_Invitation_Constraint = exports.Registrant_Invitation_Constraint || (exports.Registrant_Invitation_Constraint = {}));
var Registrant_Invitation_Select_Column;
(function (Registrant_Invitation_Select_Column) {
    Registrant_Invitation_Select_Column["ConferenceId"] = "conferenceId";
    Registrant_Invitation_Select_Column["ConfirmationCode"] = "confirmationCode";
    Registrant_Invitation_Select_Column["CreatedAt"] = "createdAt";
    Registrant_Invitation_Select_Column["Id"] = "id";
    Registrant_Invitation_Select_Column["InviteCode"] = "inviteCode";
    Registrant_Invitation_Select_Column["InvitedEmailAddress"] = "invitedEmailAddress";
    Registrant_Invitation_Select_Column["LinkToUserId"] = "linkToUserId";
    Registrant_Invitation_Select_Column["RegistrantId"] = "registrantId";
    Registrant_Invitation_Select_Column["UpdatedAt"] = "updatedAt";
})(Registrant_Invitation_Select_Column = exports.Registrant_Invitation_Select_Column || (exports.Registrant_Invitation_Select_Column = {}));
var Registrant_Invitation_Update_Column;
(function (Registrant_Invitation_Update_Column) {
    Registrant_Invitation_Update_Column["ConferenceId"] = "conferenceId";
    Registrant_Invitation_Update_Column["ConfirmationCode"] = "confirmationCode";
    Registrant_Invitation_Update_Column["CreatedAt"] = "createdAt";
    Registrant_Invitation_Update_Column["Id"] = "id";
    Registrant_Invitation_Update_Column["InviteCode"] = "inviteCode";
    Registrant_Invitation_Update_Column["InvitedEmailAddress"] = "invitedEmailAddress";
    Registrant_Invitation_Update_Column["LinkToUserId"] = "linkToUserId";
    Registrant_Invitation_Update_Column["RegistrantId"] = "registrantId";
    Registrant_Invitation_Update_Column["UpdatedAt"] = "updatedAt";
})(Registrant_Invitation_Update_Column = exports.Registrant_Invitation_Update_Column || (exports.Registrant_Invitation_Update_Column = {}));
var Registrant_ProfileBadges_Select_Column;
(function (Registrant_ProfileBadges_Select_Column) {
    Registrant_ProfileBadges_Select_Column["Colour"] = "colour";
    Registrant_ProfileBadges_Select_Column["Name"] = "name";
    Registrant_ProfileBadges_Select_Column["RegistrantId"] = "registrantId";
})(Registrant_ProfileBadges_Select_Column = exports.Registrant_ProfileBadges_Select_Column || (exports.Registrant_ProfileBadges_Select_Column = {}));
var Registrant_Profile_Constraint;
(function (Registrant_Profile_Constraint) {
    Registrant_Profile_Constraint["ProfilePkey"] = "Profile_pkey";
    Registrant_Profile_Constraint["ProfileRegistrantIdKey"] = "Profile_registrantId_key";
})(Registrant_Profile_Constraint = exports.Registrant_Profile_Constraint || (exports.Registrant_Profile_Constraint = {}));
var Registrant_Profile_Select_Column;
(function (Registrant_Profile_Select_Column) {
    Registrant_Profile_Select_Column["Affiliation"] = "affiliation";
    Registrant_Profile_Select_Column["AffiliationUrl"] = "affiliationURL";
    Registrant_Profile_Select_Column["Badges"] = "badges";
    Registrant_Profile_Select_Column["Bio"] = "bio";
    Registrant_Profile_Select_Column["Country"] = "country";
    Registrant_Profile_Select_Column["CreatedAt"] = "created_at";
    Registrant_Profile_Select_Column["Github"] = "github";
    Registrant_Profile_Select_Column["HasBeenEdited"] = "hasBeenEdited";
    Registrant_Profile_Select_Column["PhotoS3BucketName"] = "photoS3BucketName";
    Registrant_Profile_Select_Column["PhotoS3BucketRegion"] = "photoS3BucketRegion";
    Registrant_Profile_Select_Column["PhotoS3ObjectName"] = "photoS3ObjectName";
    Registrant_Profile_Select_Column["PhotoUrl_350x350"] = "photoURL_350x350";
    Registrant_Profile_Select_Column["PhotoUrl_50x50"] = "photoURL_50x50";
    Registrant_Profile_Select_Column["Pronouns"] = "pronouns";
    Registrant_Profile_Select_Column["RegistrantId"] = "registrantId";
    Registrant_Profile_Select_Column["TimezoneUtcOffset"] = "timezoneUTCOffset";
    Registrant_Profile_Select_Column["Twitter"] = "twitter";
    Registrant_Profile_Select_Column["UpdatedAt"] = "updated_at";
    Registrant_Profile_Select_Column["Website"] = "website";
})(Registrant_Profile_Select_Column = exports.Registrant_Profile_Select_Column || (exports.Registrant_Profile_Select_Column = {}));
var Registrant_Profile_Update_Column;
(function (Registrant_Profile_Update_Column) {
    Registrant_Profile_Update_Column["Affiliation"] = "affiliation";
    Registrant_Profile_Update_Column["AffiliationUrl"] = "affiliationURL";
    Registrant_Profile_Update_Column["Badges"] = "badges";
    Registrant_Profile_Update_Column["Bio"] = "bio";
    Registrant_Profile_Update_Column["Country"] = "country";
    Registrant_Profile_Update_Column["CreatedAt"] = "created_at";
    Registrant_Profile_Update_Column["Github"] = "github";
    Registrant_Profile_Update_Column["HasBeenEdited"] = "hasBeenEdited";
    Registrant_Profile_Update_Column["PhotoS3BucketName"] = "photoS3BucketName";
    Registrant_Profile_Update_Column["PhotoS3BucketRegion"] = "photoS3BucketRegion";
    Registrant_Profile_Update_Column["PhotoS3ObjectName"] = "photoS3ObjectName";
    Registrant_Profile_Update_Column["PhotoUrl_350x350"] = "photoURL_350x350";
    Registrant_Profile_Update_Column["PhotoUrl_50x50"] = "photoURL_50x50";
    Registrant_Profile_Update_Column["Pronouns"] = "pronouns";
    Registrant_Profile_Update_Column["RegistrantId"] = "registrantId";
    Registrant_Profile_Update_Column["TimezoneUtcOffset"] = "timezoneUTCOffset";
    Registrant_Profile_Update_Column["Twitter"] = "twitter";
    Registrant_Profile_Update_Column["UpdatedAt"] = "updated_at";
    Registrant_Profile_Update_Column["Website"] = "website";
})(Registrant_Profile_Update_Column = exports.Registrant_Profile_Update_Column || (exports.Registrant_Profile_Update_Column = {}));
var Registrant_RegistrantRole_Constraint;
(function (Registrant_RegistrantRole_Constraint) {
    Registrant_RegistrantRole_Constraint["RegistrantRolePkey"] = "RegistrantRole_pkey";
})(Registrant_RegistrantRole_Constraint = exports.Registrant_RegistrantRole_Constraint || (exports.Registrant_RegistrantRole_Constraint = {}));
var Registrant_RegistrantRole_Enum;
(function (Registrant_RegistrantRole_Enum) {
    Registrant_RegistrantRole_Enum["Attendee"] = "ATTENDEE";
    Registrant_RegistrantRole_Enum["Moderator"] = "MODERATOR";
    Registrant_RegistrantRole_Enum["Organizer"] = "ORGANIZER";
})(Registrant_RegistrantRole_Enum = exports.Registrant_RegistrantRole_Enum || (exports.Registrant_RegistrantRole_Enum = {}));
var Registrant_RegistrantRole_Select_Column;
(function (Registrant_RegistrantRole_Select_Column) {
    Registrant_RegistrantRole_Select_Column["Description"] = "description";
    Registrant_RegistrantRole_Select_Column["Name"] = "name";
})(Registrant_RegistrantRole_Select_Column = exports.Registrant_RegistrantRole_Select_Column || (exports.Registrant_RegistrantRole_Select_Column = {}));
var Registrant_RegistrantRole_Update_Column;
(function (Registrant_RegistrantRole_Update_Column) {
    Registrant_RegistrantRole_Update_Column["Description"] = "description";
    Registrant_RegistrantRole_Update_Column["Name"] = "name";
})(Registrant_RegistrantRole_Update_Column = exports.Registrant_RegistrantRole_Update_Column || (exports.Registrant_RegistrantRole_Update_Column = {}));
var Registrant_Registrant_Constraint;
(function (Registrant_Registrant_Constraint) {
    Registrant_Registrant_Constraint["RegistrantConferenceIdUserIdKey"] = "Registrant_conferenceId_userId_key";
    Registrant_Registrant_Constraint["RegistrantPkey"] = "Registrant_pkey";
})(Registrant_Registrant_Constraint = exports.Registrant_Registrant_Constraint || (exports.Registrant_Registrant_Constraint = {}));
var Registrant_Registrant_Select_Column;
(function (Registrant_Registrant_Select_Column) {
    Registrant_Registrant_Select_Column["ConferenceId"] = "conferenceId";
    Registrant_Registrant_Select_Column["ConferenceRole"] = "conferenceRole";
    Registrant_Registrant_Select_Column["CreatedAt"] = "createdAt";
    Registrant_Registrant_Select_Column["DisplayName"] = "displayName";
    Registrant_Registrant_Select_Column["Id"] = "id";
    Registrant_Registrant_Select_Column["UpdatedAt"] = "updatedAt";
    Registrant_Registrant_Select_Column["UserId"] = "userId";
})(Registrant_Registrant_Select_Column = exports.Registrant_Registrant_Select_Column || (exports.Registrant_Registrant_Select_Column = {}));
var Registrant_Registrant_Update_Column;
(function (Registrant_Registrant_Update_Column) {
    Registrant_Registrant_Update_Column["ConferenceId"] = "conferenceId";
    Registrant_Registrant_Update_Column["ConferenceRole"] = "conferenceRole";
    Registrant_Registrant_Update_Column["CreatedAt"] = "createdAt";
    Registrant_Registrant_Update_Column["DisplayName"] = "displayName";
    Registrant_Registrant_Update_Column["Id"] = "id";
    Registrant_Registrant_Update_Column["UpdatedAt"] = "updatedAt";
    Registrant_Registrant_Update_Column["UserId"] = "userId";
})(Registrant_Registrant_Update_Column = exports.Registrant_Registrant_Update_Column || (exports.Registrant_Registrant_Update_Column = {}));
var Registrant_SavedVonageRoomRecording_Constraint;
(function (Registrant_SavedVonageRoomRecording_Constraint) {
    Registrant_SavedVonageRoomRecording_Constraint["SavedVonageRoomRecordingPkey"] = "SavedVonageRoomRecording_pkey";
    Registrant_SavedVonageRoomRecording_Constraint["SavedVonageRoomRecordingRecordingIdRegistrantIdKey"] = "SavedVonageRoomRecording_recordingId_registrantId_key";
})(Registrant_SavedVonageRoomRecording_Constraint = exports.Registrant_SavedVonageRoomRecording_Constraint || (exports.Registrant_SavedVonageRoomRecording_Constraint = {}));
var Registrant_SavedVonageRoomRecording_Select_Column;
(function (Registrant_SavedVonageRoomRecording_Select_Column) {
    Registrant_SavedVonageRoomRecording_Select_Column["CreatedAt"] = "created_at";
    Registrant_SavedVonageRoomRecording_Select_Column["Id"] = "id";
    Registrant_SavedVonageRoomRecording_Select_Column["IsHidden"] = "isHidden";
    Registrant_SavedVonageRoomRecording_Select_Column["RecordingId"] = "recordingId";
    Registrant_SavedVonageRoomRecording_Select_Column["RegistrantId"] = "registrantId";
    Registrant_SavedVonageRoomRecording_Select_Column["UpdatedAt"] = "updated_at";
})(Registrant_SavedVonageRoomRecording_Select_Column = exports.Registrant_SavedVonageRoomRecording_Select_Column || (exports.Registrant_SavedVonageRoomRecording_Select_Column = {}));
var Registrant_SavedVonageRoomRecording_Update_Column;
(function (Registrant_SavedVonageRoomRecording_Update_Column) {
    Registrant_SavedVonageRoomRecording_Update_Column["CreatedAt"] = "created_at";
    Registrant_SavedVonageRoomRecording_Update_Column["Id"] = "id";
    Registrant_SavedVonageRoomRecording_Update_Column["IsHidden"] = "isHidden";
    Registrant_SavedVonageRoomRecording_Update_Column["RecordingId"] = "recordingId";
    Registrant_SavedVonageRoomRecording_Update_Column["RegistrantId"] = "registrantId";
    Registrant_SavedVonageRoomRecording_Update_Column["UpdatedAt"] = "updated_at";
})(Registrant_SavedVonageRoomRecording_Update_Column = exports.Registrant_SavedVonageRoomRecording_Update_Column || (exports.Registrant_SavedVonageRoomRecording_Update_Column = {}));
var Registrant_SubconferenceMembership_Constraint;
(function (Registrant_SubconferenceMembership_Constraint) {
    Registrant_SubconferenceMembership_Constraint["SubconferenceMembershipPkey"] = "SubconferenceMembership_pkey";
    Registrant_SubconferenceMembership_Constraint["SubconferenceMembershipSubconferenceIdRegistrantIdKey"] = "SubconferenceMembership_subconferenceId_registrantId_key";
})(Registrant_SubconferenceMembership_Constraint = exports.Registrant_SubconferenceMembership_Constraint || (exports.Registrant_SubconferenceMembership_Constraint = {}));
var Registrant_SubconferenceMembership_Select_Column;
(function (Registrant_SubconferenceMembership_Select_Column) {
    Registrant_SubconferenceMembership_Select_Column["CreatedAt"] = "created_at";
    Registrant_SubconferenceMembership_Select_Column["Id"] = "id";
    Registrant_SubconferenceMembership_Select_Column["RegistrantId"] = "registrantId";
    Registrant_SubconferenceMembership_Select_Column["Role"] = "role";
    Registrant_SubconferenceMembership_Select_Column["SubconferenceId"] = "subconferenceId";
    Registrant_SubconferenceMembership_Select_Column["UpdatedAt"] = "updated_at";
})(Registrant_SubconferenceMembership_Select_Column = exports.Registrant_SubconferenceMembership_Select_Column || (exports.Registrant_SubconferenceMembership_Select_Column = {}));
var Registrant_SubconferenceMembership_Update_Column;
(function (Registrant_SubconferenceMembership_Update_Column) {
    Registrant_SubconferenceMembership_Update_Column["CreatedAt"] = "created_at";
    Registrant_SubconferenceMembership_Update_Column["Id"] = "id";
    Registrant_SubconferenceMembership_Update_Column["RegistrantId"] = "registrantId";
    Registrant_SubconferenceMembership_Update_Column["Role"] = "role";
    Registrant_SubconferenceMembership_Update_Column["SubconferenceId"] = "subconferenceId";
    Registrant_SubconferenceMembership_Update_Column["UpdatedAt"] = "updated_at";
})(Registrant_SubconferenceMembership_Update_Column = exports.Registrant_SubconferenceMembership_Update_Column || (exports.Registrant_SubconferenceMembership_Update_Column = {}));
var Room_Backend_Constraint;
(function (Room_Backend_Constraint) {
    Room_Backend_Constraint["VideoRoomBackendPkey"] = "VideoRoomBackend_pkey";
})(Room_Backend_Constraint = exports.Room_Backend_Constraint || (exports.Room_Backend_Constraint = {}));
var Room_Backend_Enum;
(function (Room_Backend_Enum) {
    Room_Backend_Enum["Chime"] = "CHIME";
    Room_Backend_Enum["Vonage"] = "VONAGE";
})(Room_Backend_Enum = exports.Room_Backend_Enum || (exports.Room_Backend_Enum = {}));
var Room_Backend_Select_Column;
(function (Room_Backend_Select_Column) {
    Room_Backend_Select_Column["Description"] = "description";
    Room_Backend_Select_Column["Name"] = "name";
})(Room_Backend_Select_Column = exports.Room_Backend_Select_Column || (exports.Room_Backend_Select_Column = {}));
var Room_Backend_Update_Column;
(function (Room_Backend_Update_Column) {
    Room_Backend_Update_Column["Description"] = "description";
    Room_Backend_Update_Column["Name"] = "name";
})(Room_Backend_Update_Column = exports.Room_Backend_Update_Column || (exports.Room_Backend_Update_Column = {}));
var Room_ChimeMeeting_Constraint;
(function (Room_ChimeMeeting_Constraint) {
    Room_ChimeMeeting_Constraint["ChimeMeetingPkey"] = "ChimeMeeting_pkey";
    Room_ChimeMeeting_Constraint["ChimeMeetingRoomIdKey"] = "ChimeMeeting_roomId_key";
})(Room_ChimeMeeting_Constraint = exports.Room_ChimeMeeting_Constraint || (exports.Room_ChimeMeeting_Constraint = {}));
var Room_ChimeMeeting_Select_Column;
(function (Room_ChimeMeeting_Select_Column) {
    Room_ChimeMeeting_Select_Column["ChimeMeetingData"] = "chimeMeetingData";
    Room_ChimeMeeting_Select_Column["ChimeMeetingId"] = "chimeMeetingId";
    Room_ChimeMeeting_Select_Column["ConferenceId"] = "conferenceId";
    Room_ChimeMeeting_Select_Column["CreatedAt"] = "createdAt";
    Room_ChimeMeeting_Select_Column["Id"] = "id";
    Room_ChimeMeeting_Select_Column["RoomId"] = "roomId";
    Room_ChimeMeeting_Select_Column["SubconferenceId"] = "subconferenceId";
    Room_ChimeMeeting_Select_Column["UpdatedAt"] = "updatedAt";
})(Room_ChimeMeeting_Select_Column = exports.Room_ChimeMeeting_Select_Column || (exports.Room_ChimeMeeting_Select_Column = {}));
var Room_ChimeMeeting_Update_Column;
(function (Room_ChimeMeeting_Update_Column) {
    Room_ChimeMeeting_Update_Column["ChimeMeetingData"] = "chimeMeetingData";
    Room_ChimeMeeting_Update_Column["ChimeMeetingId"] = "chimeMeetingId";
    Room_ChimeMeeting_Update_Column["ConferenceId"] = "conferenceId";
    Room_ChimeMeeting_Update_Column["CreatedAt"] = "createdAt";
    Room_ChimeMeeting_Update_Column["Id"] = "id";
    Room_ChimeMeeting_Update_Column["RoomId"] = "roomId";
    Room_ChimeMeeting_Update_Column["SubconferenceId"] = "subconferenceId";
    Room_ChimeMeeting_Update_Column["UpdatedAt"] = "updatedAt";
})(Room_ChimeMeeting_Update_Column = exports.Room_ChimeMeeting_Update_Column || (exports.Room_ChimeMeeting_Update_Column = {}));
var Room_LivestreamDurations_Select_Column;
(function (Room_LivestreamDurations_Select_Column) {
    Room_LivestreamDurations_Select_Column["ConferenceId"] = "conferenceId";
    Room_LivestreamDurations_Select_Column["RoomId"] = "roomId";
    Room_LivestreamDurations_Select_Column["SubconferenceId"] = "subconferenceId";
    Room_LivestreamDurations_Select_Column["Sum"] = "sum";
})(Room_LivestreamDurations_Select_Column = exports.Room_LivestreamDurations_Select_Column || (exports.Room_LivestreamDurations_Select_Column = {}));
var Room_ManagementMode_Constraint;
(function (Room_ManagementMode_Constraint) {
    Room_ManagementMode_Constraint["ManagementModePkey"] = "ManagementMode_pkey";
})(Room_ManagementMode_Constraint = exports.Room_ManagementMode_Constraint || (exports.Room_ManagementMode_Constraint = {}));
var Room_ManagementMode_Enum;
(function (Room_ManagementMode_Enum) {
    Room_ManagementMode_Enum["Dm"] = "DM";
    Room_ManagementMode_Enum["Managed"] = "MANAGED";
    Room_ManagementMode_Enum["Private"] = "PRIVATE";
    Room_ManagementMode_Enum["Public"] = "PUBLIC";
})(Room_ManagementMode_Enum = exports.Room_ManagementMode_Enum || (exports.Room_ManagementMode_Enum = {}));
var Room_ManagementMode_Select_Column;
(function (Room_ManagementMode_Select_Column) {
    Room_ManagementMode_Select_Column["Description"] = "description";
    Room_ManagementMode_Select_Column["Name"] = "name";
})(Room_ManagementMode_Select_Column = exports.Room_ManagementMode_Select_Column || (exports.Room_ManagementMode_Select_Column = {}));
var Room_ManagementMode_Update_Column;
(function (Room_ManagementMode_Update_Column) {
    Room_ManagementMode_Update_Column["Description"] = "description";
    Room_ManagementMode_Update_Column["Name"] = "name";
})(Room_ManagementMode_Update_Column = exports.Room_ManagementMode_Update_Column || (exports.Room_ManagementMode_Update_Column = {}));
var Room_Mode_Constraint;
(function (Room_Mode_Constraint) {
    Room_Mode_Constraint["ModePkey"] = "Mode_pkey";
})(Room_Mode_Constraint = exports.Room_Mode_Constraint || (exports.Room_Mode_Constraint = {}));
var Room_Mode_Enum;
(function (Room_Mode_Enum) {
    Room_Mode_Enum["Exhibition"] = "EXHIBITION";
    Room_Mode_Enum["None"] = "NONE";
    Room_Mode_Enum["Prerecorded"] = "PRERECORDED";
    Room_Mode_Enum["Presentation"] = "PRESENTATION";
    Room_Mode_Enum["QAndA"] = "Q_AND_A";
    Room_Mode_Enum["Shuffle"] = "SHUFFLE";
    Room_Mode_Enum["VideoChat"] = "VIDEO_CHAT";
    Room_Mode_Enum["VideoPlayer"] = "VIDEO_PLAYER";
    Room_Mode_Enum["Zoom"] = "ZOOM";
})(Room_Mode_Enum = exports.Room_Mode_Enum || (exports.Room_Mode_Enum = {}));
var Room_Mode_Select_Column;
(function (Room_Mode_Select_Column) {
    Room_Mode_Select_Column["Description"] = "description";
    Room_Mode_Select_Column["Name"] = "name";
})(Room_Mode_Select_Column = exports.Room_Mode_Select_Column || (exports.Room_Mode_Select_Column = {}));
var Room_Mode_Update_Column;
(function (Room_Mode_Update_Column) {
    Room_Mode_Update_Column["Description"] = "description";
    Room_Mode_Update_Column["Name"] = "name";
})(Room_Mode_Update_Column = exports.Room_Mode_Update_Column || (exports.Room_Mode_Update_Column = {}));
var Room_Participant_Constraint;
(function (Room_Participant_Constraint) {
    Room_Participant_Constraint["ParticipantPkey"] = "Participant_pkey";
    Room_Participant_Constraint["ParticipantRoomIdRegistrantIdKey"] = "Participant_roomId_registrantId_key";
})(Room_Participant_Constraint = exports.Room_Participant_Constraint || (exports.Room_Participant_Constraint = {}));
var Room_Participant_Select_Column;
(function (Room_Participant_Select_Column) {
    Room_Participant_Select_Column["ChimeRegistrantId"] = "chimeRegistrantId";
    Room_Participant_Select_Column["ConferenceId"] = "conferenceId";
    Room_Participant_Select_Column["CreatedAt"] = "createdAt";
    Room_Participant_Select_Column["Id"] = "id";
    Room_Participant_Select_Column["RegistrantId"] = "registrantId";
    Room_Participant_Select_Column["RoomId"] = "roomId";
    Room_Participant_Select_Column["SubconferenceId"] = "subconferenceId";
    Room_Participant_Select_Column["UpdatedAt"] = "updatedAt";
    Room_Participant_Select_Column["VonageConnectionId"] = "vonageConnectionId";
})(Room_Participant_Select_Column = exports.Room_Participant_Select_Column || (exports.Room_Participant_Select_Column = {}));
var Room_Participant_Update_Column;
(function (Room_Participant_Update_Column) {
    Room_Participant_Update_Column["ChimeRegistrantId"] = "chimeRegistrantId";
    Room_Participant_Update_Column["ConferenceId"] = "conferenceId";
    Room_Participant_Update_Column["CreatedAt"] = "createdAt";
    Room_Participant_Update_Column["Id"] = "id";
    Room_Participant_Update_Column["RegistrantId"] = "registrantId";
    Room_Participant_Update_Column["RoomId"] = "roomId";
    Room_Participant_Update_Column["SubconferenceId"] = "subconferenceId";
    Room_Participant_Update_Column["UpdatedAt"] = "updatedAt";
    Room_Participant_Update_Column["VonageConnectionId"] = "vonageConnectionId";
})(Room_Participant_Update_Column = exports.Room_Participant_Update_Column || (exports.Room_Participant_Update_Column = {}));
var Room_PersonRole_Constraint;
(function (Room_PersonRole_Constraint) {
    Room_PersonRole_Constraint["PersonRolePkey"] = "PersonRole_pkey";
})(Room_PersonRole_Constraint = exports.Room_PersonRole_Constraint || (exports.Room_PersonRole_Constraint = {}));
var Room_PersonRole_Enum;
(function (Room_PersonRole_Enum) {
    Room_PersonRole_Enum["Admin"] = "ADMIN";
    Room_PersonRole_Enum["Participant"] = "PARTICIPANT";
})(Room_PersonRole_Enum = exports.Room_PersonRole_Enum || (exports.Room_PersonRole_Enum = {}));
var Room_PersonRole_Select_Column;
(function (Room_PersonRole_Select_Column) {
    Room_PersonRole_Select_Column["Description"] = "description";
    Room_PersonRole_Select_Column["Name"] = "name";
})(Room_PersonRole_Select_Column = exports.Room_PersonRole_Select_Column || (exports.Room_PersonRole_Select_Column = {}));
var Room_PersonRole_Update_Column;
(function (Room_PersonRole_Update_Column) {
    Room_PersonRole_Update_Column["Description"] = "description";
    Room_PersonRole_Update_Column["Name"] = "name";
})(Room_PersonRole_Update_Column = exports.Room_PersonRole_Update_Column || (exports.Room_PersonRole_Update_Column = {}));
var Room_RoomMembership_Constraint;
(function (Room_RoomMembership_Constraint) {
    Room_RoomMembership_Constraint["RoomPersonPkey"] = "RoomPerson_pkey";
    Room_RoomMembership_Constraint["RoomPersonRegistrantIdRoomIdKey"] = "RoomPerson_registrantId_roomId_key";
})(Room_RoomMembership_Constraint = exports.Room_RoomMembership_Constraint || (exports.Room_RoomMembership_Constraint = {}));
var Room_RoomMembership_Select_Column;
(function (Room_RoomMembership_Select_Column) {
    Room_RoomMembership_Select_Column["CreatedAt"] = "createdAt";
    Room_RoomMembership_Select_Column["Id"] = "id";
    Room_RoomMembership_Select_Column["PersonRoleName"] = "personRoleName";
    Room_RoomMembership_Select_Column["RegistrantId"] = "registrantId";
    Room_RoomMembership_Select_Column["RoomId"] = "roomId";
    Room_RoomMembership_Select_Column["UpdatedAt"] = "updatedAt";
})(Room_RoomMembership_Select_Column = exports.Room_RoomMembership_Select_Column || (exports.Room_RoomMembership_Select_Column = {}));
var Room_RoomMembership_Update_Column;
(function (Room_RoomMembership_Update_Column) {
    Room_RoomMembership_Update_Column["CreatedAt"] = "createdAt";
    Room_RoomMembership_Update_Column["Id"] = "id";
    Room_RoomMembership_Update_Column["PersonRoleName"] = "personRoleName";
    Room_RoomMembership_Update_Column["RegistrantId"] = "registrantId";
    Room_RoomMembership_Update_Column["RoomId"] = "roomId";
    Room_RoomMembership_Update_Column["UpdatedAt"] = "updatedAt";
})(Room_RoomMembership_Update_Column = exports.Room_RoomMembership_Update_Column || (exports.Room_RoomMembership_Update_Column = {}));
var Room_Room_Constraint;
(function (Room_Room_Constraint) {
    Room_Room_Constraint["RoomOriginatingEventIdKey"] = "Room_originatingEventId_key";
    Room_Room_Constraint["RoomPkey"] = "Room_pkey";
})(Room_Room_Constraint = exports.Room_Room_Constraint || (exports.Room_Room_Constraint = {}));
var Room_Room_Select_Column;
(function (Room_Room_Select_Column) {
    Room_Room_Select_Column["BackendName"] = "backendName";
    Room_Room_Select_Column["Capacity"] = "capacity";
    Room_Room_Select_Column["ChatId"] = "chatId";
    Room_Room_Select_Column["Colour"] = "colour";
    Room_Room_Select_Column["ConferenceId"] = "conferenceId";
    Room_Room_Select_Column["CreatedAt"] = "created_at";
    Room_Room_Select_Column["CurrentModeName"] = "currentModeName";
    Room_Room_Select_Column["Id"] = "id";
    Room_Room_Select_Column["ManagementModeName"] = "managementModeName";
    Room_Room_Select_Column["Name"] = "name";
    Room_Room_Select_Column["OriginatingDataId"] = "originatingDataId";
    Room_Room_Select_Column["OriginatingEventId"] = "originatingEventId";
    Room_Room_Select_Column["OriginatingItemId"] = "originatingItemId";
    Room_Room_Select_Column["Priority"] = "priority";
    Room_Room_Select_Column["PublicVonageSessionId"] = "publicVonageSessionId";
    Room_Room_Select_Column["SubconferenceId"] = "subconferenceId";
    Room_Room_Select_Column["UpdatedAt"] = "updated_at";
})(Room_Room_Select_Column = exports.Room_Room_Select_Column || (exports.Room_Room_Select_Column = {}));
var Room_Room_Update_Column;
(function (Room_Room_Update_Column) {
    Room_Room_Update_Column["BackendName"] = "backendName";
    Room_Room_Update_Column["Capacity"] = "capacity";
    Room_Room_Update_Column["ChatId"] = "chatId";
    Room_Room_Update_Column["Colour"] = "colour";
    Room_Room_Update_Column["ConferenceId"] = "conferenceId";
    Room_Room_Update_Column["CreatedAt"] = "created_at";
    Room_Room_Update_Column["CurrentModeName"] = "currentModeName";
    Room_Room_Update_Column["Id"] = "id";
    Room_Room_Update_Column["ManagementModeName"] = "managementModeName";
    Room_Room_Update_Column["Name"] = "name";
    Room_Room_Update_Column["OriginatingDataId"] = "originatingDataId";
    Room_Room_Update_Column["OriginatingEventId"] = "originatingEventId";
    Room_Room_Update_Column["OriginatingItemId"] = "originatingItemId";
    Room_Room_Update_Column["Priority"] = "priority";
    Room_Room_Update_Column["PublicVonageSessionId"] = "publicVonageSessionId";
    Room_Room_Update_Column["SubconferenceId"] = "subconferenceId";
    Room_Room_Update_Column["UpdatedAt"] = "updated_at";
})(Room_Room_Update_Column = exports.Room_Room_Update_Column || (exports.Room_Room_Update_Column = {}));
var Room_ShuffleAlgorithm_Constraint;
(function (Room_ShuffleAlgorithm_Constraint) {
    Room_ShuffleAlgorithm_Constraint["ShuffleAlgorithmPkey"] = "ShuffleAlgorithm_pkey";
})(Room_ShuffleAlgorithm_Constraint = exports.Room_ShuffleAlgorithm_Constraint || (exports.Room_ShuffleAlgorithm_Constraint = {}));
var Room_ShuffleAlgorithm_Enum;
(function (Room_ShuffleAlgorithm_Enum) {
    Room_ShuffleAlgorithm_Enum["Fcfs"] = "fcfs";
    Room_ShuffleAlgorithm_Enum["FcfsFixedRooms"] = "fcfs_fixed_rooms";
    Room_ShuffleAlgorithm_Enum["None"] = "none";
})(Room_ShuffleAlgorithm_Enum = exports.Room_ShuffleAlgorithm_Enum || (exports.Room_ShuffleAlgorithm_Enum = {}));
var Room_ShuffleAlgorithm_Select_Column;
(function (Room_ShuffleAlgorithm_Select_Column) {
    Room_ShuffleAlgorithm_Select_Column["Description"] = "description";
    Room_ShuffleAlgorithm_Select_Column["Name"] = "name";
})(Room_ShuffleAlgorithm_Select_Column = exports.Room_ShuffleAlgorithm_Select_Column || (exports.Room_ShuffleAlgorithm_Select_Column = {}));
var Room_ShuffleAlgorithm_Update_Column;
(function (Room_ShuffleAlgorithm_Update_Column) {
    Room_ShuffleAlgorithm_Update_Column["Description"] = "description";
    Room_ShuffleAlgorithm_Update_Column["Name"] = "name";
})(Room_ShuffleAlgorithm_Update_Column = exports.Room_ShuffleAlgorithm_Update_Column || (exports.Room_ShuffleAlgorithm_Update_Column = {}));
var Room_ShufflePeriod_Constraint;
(function (Room_ShufflePeriod_Constraint) {
    Room_ShufflePeriod_Constraint["ShufflePeriodPkey"] = "ShufflePeriod_pkey";
})(Room_ShufflePeriod_Constraint = exports.Room_ShufflePeriod_Constraint || (exports.Room_ShufflePeriod_Constraint = {}));
var Room_ShufflePeriod_Select_Column;
(function (Room_ShufflePeriod_Select_Column) {
    Room_ShufflePeriod_Select_Column["Algorithm"] = "algorithm";
    Room_ShufflePeriod_Select_Column["ConferenceId"] = "conferenceId";
    Room_ShufflePeriod_Select_Column["CreatedAt"] = "created_at";
    Room_ShufflePeriod_Select_Column["EndAt"] = "endAt";
    Room_ShufflePeriod_Select_Column["Id"] = "id";
    Room_ShufflePeriod_Select_Column["MaxRegistrantsPerRoom"] = "maxRegistrantsPerRoom";
    Room_ShufflePeriod_Select_Column["Name"] = "name";
    Room_ShufflePeriod_Select_Column["OrganiserId"] = "organiserId";
    Room_ShufflePeriod_Select_Column["RoomDurationMinutes"] = "roomDurationMinutes";
    Room_ShufflePeriod_Select_Column["StartAt"] = "startAt";
    Room_ShufflePeriod_Select_Column["SubconferenceId"] = "subconferenceId";
    Room_ShufflePeriod_Select_Column["TargetRegistrantsPerRoom"] = "targetRegistrantsPerRoom";
    Room_ShufflePeriod_Select_Column["UpdatedAt"] = "updated_at";
    Room_ShufflePeriod_Select_Column["WaitRoomMaxDurationSeconds"] = "waitRoomMaxDurationSeconds";
})(Room_ShufflePeriod_Select_Column = exports.Room_ShufflePeriod_Select_Column || (exports.Room_ShufflePeriod_Select_Column = {}));
var Room_ShufflePeriod_Update_Column;
(function (Room_ShufflePeriod_Update_Column) {
    Room_ShufflePeriod_Update_Column["Algorithm"] = "algorithm";
    Room_ShufflePeriod_Update_Column["ConferenceId"] = "conferenceId";
    Room_ShufflePeriod_Update_Column["CreatedAt"] = "created_at";
    Room_ShufflePeriod_Update_Column["EndAt"] = "endAt";
    Room_ShufflePeriod_Update_Column["Id"] = "id";
    Room_ShufflePeriod_Update_Column["MaxRegistrantsPerRoom"] = "maxRegistrantsPerRoom";
    Room_ShufflePeriod_Update_Column["Name"] = "name";
    Room_ShufflePeriod_Update_Column["OrganiserId"] = "organiserId";
    Room_ShufflePeriod_Update_Column["RoomDurationMinutes"] = "roomDurationMinutes";
    Room_ShufflePeriod_Update_Column["StartAt"] = "startAt";
    Room_ShufflePeriod_Update_Column["SubconferenceId"] = "subconferenceId";
    Room_ShufflePeriod_Update_Column["TargetRegistrantsPerRoom"] = "targetRegistrantsPerRoom";
    Room_ShufflePeriod_Update_Column["UpdatedAt"] = "updated_at";
    Room_ShufflePeriod_Update_Column["WaitRoomMaxDurationSeconds"] = "waitRoomMaxDurationSeconds";
})(Room_ShufflePeriod_Update_Column = exports.Room_ShufflePeriod_Update_Column || (exports.Room_ShufflePeriod_Update_Column = {}));
var Room_ShuffleQueueEntry_Constraint;
(function (Room_ShuffleQueueEntry_Constraint) {
    Room_ShuffleQueueEntry_Constraint["ShuffleQueueEntryPkey"] = "ShuffleQueueEntry_pkey";
    Room_ShuffleQueueEntry_Constraint["RoomShuffleQueueEntryIsWaiting"] = "room_ShuffleQueueEntry_isWaiting";
})(Room_ShuffleQueueEntry_Constraint = exports.Room_ShuffleQueueEntry_Constraint || (exports.Room_ShuffleQueueEntry_Constraint = {}));
var Room_ShuffleQueueEntry_Select_Column;
(function (Room_ShuffleQueueEntry_Select_Column) {
    Room_ShuffleQueueEntry_Select_Column["AllocatedShuffleRoomId"] = "allocatedShuffleRoomId";
    Room_ShuffleQueueEntry_Select_Column["CreatedAt"] = "created_at";
    Room_ShuffleQueueEntry_Select_Column["Id"] = "id";
    Room_ShuffleQueueEntry_Select_Column["IsExpired"] = "isExpired";
    Room_ShuffleQueueEntry_Select_Column["RegistrantId"] = "registrantId";
    Room_ShuffleQueueEntry_Select_Column["ShufflePeriodId"] = "shufflePeriodId";
    Room_ShuffleQueueEntry_Select_Column["UpdatedAt"] = "updated_at";
})(Room_ShuffleQueueEntry_Select_Column = exports.Room_ShuffleQueueEntry_Select_Column || (exports.Room_ShuffleQueueEntry_Select_Column = {}));
var Room_ShuffleQueueEntry_Update_Column;
(function (Room_ShuffleQueueEntry_Update_Column) {
    Room_ShuffleQueueEntry_Update_Column["AllocatedShuffleRoomId"] = "allocatedShuffleRoomId";
    Room_ShuffleQueueEntry_Update_Column["CreatedAt"] = "created_at";
    Room_ShuffleQueueEntry_Update_Column["Id"] = "id";
    Room_ShuffleQueueEntry_Update_Column["IsExpired"] = "isExpired";
    Room_ShuffleQueueEntry_Update_Column["RegistrantId"] = "registrantId";
    Room_ShuffleQueueEntry_Update_Column["ShufflePeriodId"] = "shufflePeriodId";
    Room_ShuffleQueueEntry_Update_Column["UpdatedAt"] = "updated_at";
})(Room_ShuffleQueueEntry_Update_Column = exports.Room_ShuffleQueueEntry_Update_Column || (exports.Room_ShuffleQueueEntry_Update_Column = {}));
var Room_ShuffleRoom_Constraint;
(function (Room_ShuffleRoom_Constraint) {
    Room_ShuffleRoom_Constraint["ShuffleRoomPkey"] = "ShuffleRoom_pkey";
})(Room_ShuffleRoom_Constraint = exports.Room_ShuffleRoom_Constraint || (exports.Room_ShuffleRoom_Constraint = {}));
var Room_ShuffleRoom_Select_Column;
(function (Room_ShuffleRoom_Select_Column) {
    Room_ShuffleRoom_Select_Column["CreatedAt"] = "created_at";
    Room_ShuffleRoom_Select_Column["DurationMinutes"] = "durationMinutes";
    Room_ShuffleRoom_Select_Column["Id"] = "id";
    Room_ShuffleRoom_Select_Column["IsEnded"] = "isEnded";
    Room_ShuffleRoom_Select_Column["ReshuffleUponEnd"] = "reshuffleUponEnd";
    Room_ShuffleRoom_Select_Column["RoomId"] = "roomId";
    Room_ShuffleRoom_Select_Column["ShufflePeriodId"] = "shufflePeriodId";
    Room_ShuffleRoom_Select_Column["StartedAt"] = "startedAt";
    Room_ShuffleRoom_Select_Column["UpdatedAt"] = "updated_at";
})(Room_ShuffleRoom_Select_Column = exports.Room_ShuffleRoom_Select_Column || (exports.Room_ShuffleRoom_Select_Column = {}));
var Room_ShuffleRoom_Update_Column;
(function (Room_ShuffleRoom_Update_Column) {
    Room_ShuffleRoom_Update_Column["CreatedAt"] = "created_at";
    Room_ShuffleRoom_Update_Column["DurationMinutes"] = "durationMinutes";
    Room_ShuffleRoom_Update_Column["Id"] = "id";
    Room_ShuffleRoom_Update_Column["IsEnded"] = "isEnded";
    Room_ShuffleRoom_Update_Column["ReshuffleUponEnd"] = "reshuffleUponEnd";
    Room_ShuffleRoom_Update_Column["RoomId"] = "roomId";
    Room_ShuffleRoom_Update_Column["ShufflePeriodId"] = "shufflePeriodId";
    Room_ShuffleRoom_Update_Column["StartedAt"] = "startedAt";
    Room_ShuffleRoom_Update_Column["UpdatedAt"] = "updated_at";
})(Room_ShuffleRoom_Update_Column = exports.Room_ShuffleRoom_Update_Column || (exports.Room_ShuffleRoom_Update_Column = {}));
var Schedule_Continuation_Constraint;
(function (Schedule_Continuation_Constraint) {
    Schedule_Continuation_Constraint["ContinuationPkey"] = "Continuation_pkey";
})(Schedule_Continuation_Constraint = exports.Schedule_Continuation_Constraint || (exports.Schedule_Continuation_Constraint = {}));
var Schedule_Continuation_Select_Column;
(function (Schedule_Continuation_Select_Column) {
    Schedule_Continuation_Select_Column["Colour"] = "colour";
    Schedule_Continuation_Select_Column["DefaultFor"] = "defaultFor";
    Schedule_Continuation_Select_Column["Description"] = "description";
    Schedule_Continuation_Select_Column["FromEvent"] = "fromEvent";
    Schedule_Continuation_Select_Column["FromShuffleQueue"] = "fromShuffleQueue";
    Schedule_Continuation_Select_Column["Id"] = "id";
    Schedule_Continuation_Select_Column["IsActiveChoice"] = "isActiveChoice";
    Schedule_Continuation_Select_Column["Priority"] = "priority";
    Schedule_Continuation_Select_Column["To"] = "to";
})(Schedule_Continuation_Select_Column = exports.Schedule_Continuation_Select_Column || (exports.Schedule_Continuation_Select_Column = {}));
var Schedule_Continuation_Update_Column;
(function (Schedule_Continuation_Update_Column) {
    Schedule_Continuation_Update_Column["Colour"] = "colour";
    Schedule_Continuation_Update_Column["DefaultFor"] = "defaultFor";
    Schedule_Continuation_Update_Column["Description"] = "description";
    Schedule_Continuation_Update_Column["FromEvent"] = "fromEvent";
    Schedule_Continuation_Update_Column["FromShuffleQueue"] = "fromShuffleQueue";
    Schedule_Continuation_Update_Column["Id"] = "id";
    Schedule_Continuation_Update_Column["IsActiveChoice"] = "isActiveChoice";
    Schedule_Continuation_Update_Column["Priority"] = "priority";
    Schedule_Continuation_Update_Column["To"] = "to";
})(Schedule_Continuation_Update_Column = exports.Schedule_Continuation_Update_Column || (exports.Schedule_Continuation_Update_Column = {}));
var Schedule_EventProgramPersonRole_Constraint;
(function (Schedule_EventProgramPersonRole_Constraint) {
    Schedule_EventProgramPersonRole_Constraint["EventProgramPersonRolePkey"] = "EventProgramPersonRole_pkey";
})(Schedule_EventProgramPersonRole_Constraint = exports.Schedule_EventProgramPersonRole_Constraint || (exports.Schedule_EventProgramPersonRole_Constraint = {}));
var Schedule_EventProgramPersonRole_Enum;
(function (Schedule_EventProgramPersonRole_Enum) {
    Schedule_EventProgramPersonRole_Enum["Chair"] = "CHAIR";
    Schedule_EventProgramPersonRole_Enum["Participant"] = "PARTICIPANT";
    Schedule_EventProgramPersonRole_Enum["Presenter"] = "PRESENTER";
})(Schedule_EventProgramPersonRole_Enum = exports.Schedule_EventProgramPersonRole_Enum || (exports.Schedule_EventProgramPersonRole_Enum = {}));
var Schedule_EventProgramPersonRole_Select_Column;
(function (Schedule_EventProgramPersonRole_Select_Column) {
    Schedule_EventProgramPersonRole_Select_Column["Description"] = "description";
    Schedule_EventProgramPersonRole_Select_Column["Name"] = "name";
})(Schedule_EventProgramPersonRole_Select_Column = exports.Schedule_EventProgramPersonRole_Select_Column || (exports.Schedule_EventProgramPersonRole_Select_Column = {}));
var Schedule_EventProgramPersonRole_Update_Column;
(function (Schedule_EventProgramPersonRole_Update_Column) {
    Schedule_EventProgramPersonRole_Update_Column["Description"] = "description";
    Schedule_EventProgramPersonRole_Update_Column["Name"] = "name";
})(Schedule_EventProgramPersonRole_Update_Column = exports.Schedule_EventProgramPersonRole_Update_Column || (exports.Schedule_EventProgramPersonRole_Update_Column = {}));
var Schedule_EventProgramPerson_Constraint;
(function (Schedule_EventProgramPerson_Constraint) {
    Schedule_EventProgramPerson_Constraint["EventProgramPersonEventIdPersonIdRoleNameKey"] = "EventProgramPerson_eventId_personId_roleName_key";
    Schedule_EventProgramPerson_Constraint["EventProgramPersonPkey"] = "EventProgramPerson_pkey";
})(Schedule_EventProgramPerson_Constraint = exports.Schedule_EventProgramPerson_Constraint || (exports.Schedule_EventProgramPerson_Constraint = {}));
var Schedule_EventProgramPerson_Select_Column;
(function (Schedule_EventProgramPerson_Select_Column) {
    Schedule_EventProgramPerson_Select_Column["CreatedAt"] = "createdAt";
    Schedule_EventProgramPerson_Select_Column["EventId"] = "eventId";
    Schedule_EventProgramPerson_Select_Column["Id"] = "id";
    Schedule_EventProgramPerson_Select_Column["PersonId"] = "personId";
    Schedule_EventProgramPerson_Select_Column["RoleName"] = "roleName";
    Schedule_EventProgramPerson_Select_Column["UpdatedAt"] = "updatedAt";
})(Schedule_EventProgramPerson_Select_Column = exports.Schedule_EventProgramPerson_Select_Column || (exports.Schedule_EventProgramPerson_Select_Column = {}));
var Schedule_EventProgramPerson_Update_Column;
(function (Schedule_EventProgramPerson_Update_Column) {
    Schedule_EventProgramPerson_Update_Column["CreatedAt"] = "createdAt";
    Schedule_EventProgramPerson_Update_Column["EventId"] = "eventId";
    Schedule_EventProgramPerson_Update_Column["Id"] = "id";
    Schedule_EventProgramPerson_Update_Column["PersonId"] = "personId";
    Schedule_EventProgramPerson_Update_Column["RoleName"] = "roleName";
    Schedule_EventProgramPerson_Update_Column["UpdatedAt"] = "updatedAt";
})(Schedule_EventProgramPerson_Update_Column = exports.Schedule_EventProgramPerson_Update_Column || (exports.Schedule_EventProgramPerson_Update_Column = {}));
var Schedule_Event_Constraint;
(function (Schedule_Event_Constraint) {
    Schedule_Event_Constraint["EventPkey"] = "Event_pkey";
})(Schedule_Event_Constraint = exports.Schedule_Event_Constraint || (exports.Schedule_Event_Constraint = {}));
var Schedule_Event_Select_Column;
(function (Schedule_Event_Select_Column) {
    Schedule_Event_Select_Column["ConferenceId"] = "conferenceId";
    Schedule_Event_Select_Column["CreatedAt"] = "createdAt";
    Schedule_Event_Select_Column["DurationSeconds"] = "durationSeconds";
    Schedule_Event_Select_Column["EnableRecording"] = "enableRecording";
    Schedule_Event_Select_Column["EndTime"] = "endTime";
    Schedule_Event_Select_Column["ExhibitionId"] = "exhibitionId";
    Schedule_Event_Select_Column["Id"] = "id";
    Schedule_Event_Select_Column["IntendedRoomModeName"] = "intendedRoomModeName";
    Schedule_Event_Select_Column["ItemId"] = "itemId";
    Schedule_Event_Select_Column["Name"] = "name";
    Schedule_Event_Select_Column["OriginatingDataId"] = "originatingDataId";
    Schedule_Event_Select_Column["RoomId"] = "roomId";
    Schedule_Event_Select_Column["ShufflePeriodId"] = "shufflePeriodId";
    Schedule_Event_Select_Column["StartTime"] = "startTime";
    Schedule_Event_Select_Column["StreamTextEventId"] = "streamTextEventId";
    Schedule_Event_Select_Column["SubconferenceId"] = "subconferenceId";
    Schedule_Event_Select_Column["TimingsUpdatedAt"] = "timingsUpdatedAt";
    Schedule_Event_Select_Column["UpdatedAt"] = "updatedAt";
    Schedule_Event_Select_Column["VisibilityLevel"] = "visibilityLevel";
})(Schedule_Event_Select_Column = exports.Schedule_Event_Select_Column || (exports.Schedule_Event_Select_Column = {}));
var Schedule_Event_Update_Column;
(function (Schedule_Event_Update_Column) {
    Schedule_Event_Update_Column["ConferenceId"] = "conferenceId";
    Schedule_Event_Update_Column["CreatedAt"] = "createdAt";
    Schedule_Event_Update_Column["DurationSeconds"] = "durationSeconds";
    Schedule_Event_Update_Column["EnableRecording"] = "enableRecording";
    Schedule_Event_Update_Column["EndTime"] = "endTime";
    Schedule_Event_Update_Column["ExhibitionId"] = "exhibitionId";
    Schedule_Event_Update_Column["Id"] = "id";
    Schedule_Event_Update_Column["IntendedRoomModeName"] = "intendedRoomModeName";
    Schedule_Event_Update_Column["ItemId"] = "itemId";
    Schedule_Event_Update_Column["Name"] = "name";
    Schedule_Event_Update_Column["OriginatingDataId"] = "originatingDataId";
    Schedule_Event_Update_Column["RoomId"] = "roomId";
    Schedule_Event_Update_Column["ShufflePeriodId"] = "shufflePeriodId";
    Schedule_Event_Update_Column["StartTime"] = "startTime";
    Schedule_Event_Update_Column["StreamTextEventId"] = "streamTextEventId";
    Schedule_Event_Update_Column["SubconferenceId"] = "subconferenceId";
    Schedule_Event_Update_Column["TimingsUpdatedAt"] = "timingsUpdatedAt";
    Schedule_Event_Update_Column["UpdatedAt"] = "updatedAt";
    Schedule_Event_Update_Column["VisibilityLevel"] = "visibilityLevel";
})(Schedule_Event_Update_Column = exports.Schedule_Event_Update_Column || (exports.Schedule_Event_Update_Column = {}));
var Schedule_OverlappingEvents_Select_Column;
(function (Schedule_OverlappingEvents_Select_Column) {
    Schedule_OverlappingEvents_Select_Column["ConferenceId"] = "conferenceId";
    Schedule_OverlappingEvents_Select_Column["SubconferenceId"] = "subconferenceId";
    Schedule_OverlappingEvents_Select_Column["XId"] = "xId";
    Schedule_OverlappingEvents_Select_Column["YId"] = "yId";
})(Schedule_OverlappingEvents_Select_Column = exports.Schedule_OverlappingEvents_Select_Column || (exports.Schedule_OverlappingEvents_Select_Column = {}));
var Schedule_StarredEvent_Constraint;
(function (Schedule_StarredEvent_Constraint) {
    Schedule_StarredEvent_Constraint["StarredEventEventIdRegistrantIdKey"] = "StarredEvent_eventId_registrantId_key";
    Schedule_StarredEvent_Constraint["StarredEventPkey"] = "StarredEvent_pkey";
})(Schedule_StarredEvent_Constraint = exports.Schedule_StarredEvent_Constraint || (exports.Schedule_StarredEvent_Constraint = {}));
var Schedule_StarredEvent_Select_Column;
(function (Schedule_StarredEvent_Select_Column) {
    Schedule_StarredEvent_Select_Column["CreatedAt"] = "created_at";
    Schedule_StarredEvent_Select_Column["EventId"] = "eventId";
    Schedule_StarredEvent_Select_Column["Id"] = "id";
    Schedule_StarredEvent_Select_Column["RegistrantId"] = "registrantId";
    Schedule_StarredEvent_Select_Column["UpdatedAt"] = "updated_at";
})(Schedule_StarredEvent_Select_Column = exports.Schedule_StarredEvent_Select_Column || (exports.Schedule_StarredEvent_Select_Column = {}));
var Schedule_StarredEvent_Update_Column;
(function (Schedule_StarredEvent_Update_Column) {
    Schedule_StarredEvent_Update_Column["CreatedAt"] = "created_at";
    Schedule_StarredEvent_Update_Column["EventId"] = "eventId";
    Schedule_StarredEvent_Update_Column["Id"] = "id";
    Schedule_StarredEvent_Update_Column["RegistrantId"] = "registrantId";
    Schedule_StarredEvent_Update_Column["UpdatedAt"] = "updated_at";
})(Schedule_StarredEvent_Update_Column = exports.Schedule_StarredEvent_Update_Column || (exports.Schedule_StarredEvent_Update_Column = {}));
var System_ConfigurationKey_Constraint;
(function (System_ConfigurationKey_Constraint) {
    System_ConfigurationKey_Constraint["ConfigurationKeyPkey"] = "ConfigurationKey_pkey";
})(System_ConfigurationKey_Constraint = exports.System_ConfigurationKey_Constraint || (exports.System_ConfigurationKey_Constraint = {}));
var System_ConfigurationKey_Enum;
(function (System_ConfigurationKey_Enum) {
    System_ConfigurationKey_Enum["AllowEmailsToDomains"] = "ALLOW_EMAILS_TO_DOMAINS";
    System_ConfigurationKey_Enum["CookiePolicyLatestRevisionTimestamp"] = "COOKIE_POLICY_LATEST_REVISION_TIMESTAMP";
    System_ConfigurationKey_Enum["CookiePolicyUrl"] = "COOKIE_POLICY_URL";
    System_ConfigurationKey_Enum["DefaultFrontendHost"] = "DEFAULT_FRONTEND_HOST";
    System_ConfigurationKey_Enum["DefaultVideoRoomBackend"] = "DEFAULT_VIDEO_ROOM_BACKEND";
    System_ConfigurationKey_Enum["EmailTemplates"] = "EMAIL_TEMPLATES";
    System_ConfigurationKey_Enum["HostOrganisationName"] = "HOST_ORGANISATION_NAME";
    System_ConfigurationKey_Enum["PrivacyPolicyLatestRevisionTimestamp"] = "PRIVACY_POLICY_LATEST_REVISION_TIMESTAMP";
    System_ConfigurationKey_Enum["PrivacyPolicyUrl"] = "PRIVACY_POLICY_URL";
    System_ConfigurationKey_Enum["SendgridApiKey"] = "SENDGRID_API_KEY";
    System_ConfigurationKey_Enum["SendgridReplyto"] = "SENDGRID_REPLYTO";
    System_ConfigurationKey_Enum["SendgridSender"] = "SENDGRID_SENDER";
    System_ConfigurationKey_Enum["SendgridSenderName"] = "SENDGRID_SENDER_NAME";
    System_ConfigurationKey_Enum["StopEmailsContactEmailAddress"] = "STOP_EMAILS_CONTACT_EMAIL_ADDRESS";
    System_ConfigurationKey_Enum["TermsLatestRevisionTimestamp"] = "TERMS_LATEST_REVISION_TIMESTAMP";
    System_ConfigurationKey_Enum["TermsUrl"] = "TERMS_URL";
    System_ConfigurationKey_Enum["VapidPrivateKey"] = "VAPID_PRIVATE_KEY";
    System_ConfigurationKey_Enum["VapidPublicKey"] = "VAPID_PUBLIC_KEY";
})(System_ConfigurationKey_Enum = exports.System_ConfigurationKey_Enum || (exports.System_ConfigurationKey_Enum = {}));
var System_ConfigurationKey_Select_Column;
(function (System_ConfigurationKey_Select_Column) {
    System_ConfigurationKey_Select_Column["Description"] = "description";
    System_ConfigurationKey_Select_Column["Name"] = "name";
})(System_ConfigurationKey_Select_Column = exports.System_ConfigurationKey_Select_Column || (exports.System_ConfigurationKey_Select_Column = {}));
var System_ConfigurationKey_Update_Column;
(function (System_ConfigurationKey_Update_Column) {
    System_ConfigurationKey_Update_Column["Description"] = "description";
    System_ConfigurationKey_Update_Column["Name"] = "name";
})(System_ConfigurationKey_Update_Column = exports.System_ConfigurationKey_Update_Column || (exports.System_ConfigurationKey_Update_Column = {}));
var System_Configuration_Constraint;
(function (System_Configuration_Constraint) {
    System_Configuration_Constraint["ConfigurationPkey"] = "Configuration_pkey";
})(System_Configuration_Constraint = exports.System_Configuration_Constraint || (exports.System_Configuration_Constraint = {}));
var System_Configuration_Select_Column;
(function (System_Configuration_Select_Column) {
    System_Configuration_Select_Column["CreatedAt"] = "created_at";
    System_Configuration_Select_Column["Key"] = "key";
    System_Configuration_Select_Column["UpdatedAt"] = "updated_at";
    System_Configuration_Select_Column["Value"] = "value";
})(System_Configuration_Select_Column = exports.System_Configuration_Select_Column || (exports.System_Configuration_Select_Column = {}));
var System_Configuration_Update_Column;
(function (System_Configuration_Update_Column) {
    System_Configuration_Update_Column["CreatedAt"] = "created_at";
    System_Configuration_Update_Column["Key"] = "key";
    System_Configuration_Update_Column["UpdatedAt"] = "updated_at";
    System_Configuration_Update_Column["Value"] = "value";
})(System_Configuration_Update_Column = exports.System_Configuration_Update_Column || (exports.System_Configuration_Update_Column = {}));
var Video_ChannelStack_Constraint;
(function (Video_ChannelStack_Constraint) {
    Video_ChannelStack_Constraint["MediaLiveChannelPkey"] = "MediaLiveChannel_pkey";
    Video_ChannelStack_Constraint["MediaLiveChannelRoomIdKey"] = "MediaLiveChannel_roomId_key";
})(Video_ChannelStack_Constraint = exports.Video_ChannelStack_Constraint || (exports.Video_ChannelStack_Constraint = {}));
var Video_ChannelStack_Select_Column;
(function (Video_ChannelStack_Select_Column) {
    Video_ChannelStack_Select_Column["ChannelStackCreateJobId"] = "channelStackCreateJobId";
    Video_ChannelStack_Select_Column["CloudFormationStackArn"] = "cloudFormationStackArn";
    Video_ChannelStack_Select_Column["CloudFrontDistributionId"] = "cloudFrontDistributionId";
    Video_ChannelStack_Select_Column["CloudFrontDomain"] = "cloudFrontDomain";
    Video_ChannelStack_Select_Column["ConferenceId"] = "conferenceId";
    Video_ChannelStack_Select_Column["CreatedAt"] = "createdAt";
    Video_ChannelStack_Select_Column["EndpointUri"] = "endpointUri";
    Video_ChannelStack_Select_Column["Id"] = "id";
    Video_ChannelStack_Select_Column["LoopingMp4InputAttachmentName"] = "loopingMp4InputAttachmentName";
    Video_ChannelStack_Select_Column["MediaLiveChannelId"] = "mediaLiveChannelId";
    Video_ChannelStack_Select_Column["MediaPackageChannelId"] = "mediaPackageChannelId";
    Video_ChannelStack_Select_Column["Mp4InputAttachmentName"] = "mp4InputAttachmentName";
    Video_ChannelStack_Select_Column["Mp4InputId"] = "mp4InputId";
    Video_ChannelStack_Select_Column["RoomId"] = "roomId";
    Video_ChannelStack_Select_Column["RtmpAInputAttachmentName"] = "rtmpAInputAttachmentName";
    Video_ChannelStack_Select_Column["RtmpAInputId"] = "rtmpAInputId";
    Video_ChannelStack_Select_Column["RtmpAInputUri"] = "rtmpAInputUri";
    Video_ChannelStack_Select_Column["RtmpBInputAttachmentName"] = "rtmpBInputAttachmentName";
    Video_ChannelStack_Select_Column["RtmpBInputId"] = "rtmpBInputId";
    Video_ChannelStack_Select_Column["RtmpBInputUri"] = "rtmpBInputUri";
    Video_ChannelStack_Select_Column["RtmpOutputDestinationId"] = "rtmpOutputDestinationId";
    Video_ChannelStack_Select_Column["RtmpOutputStreamKey"] = "rtmpOutputStreamKey";
    Video_ChannelStack_Select_Column["RtmpOutputUri"] = "rtmpOutputUri";
    Video_ChannelStack_Select_Column["UpdatedAt"] = "updatedAt";
})(Video_ChannelStack_Select_Column = exports.Video_ChannelStack_Select_Column || (exports.Video_ChannelStack_Select_Column = {}));
var Video_ChannelStack_Update_Column;
(function (Video_ChannelStack_Update_Column) {
    Video_ChannelStack_Update_Column["ChannelStackCreateJobId"] = "channelStackCreateJobId";
    Video_ChannelStack_Update_Column["CloudFormationStackArn"] = "cloudFormationStackArn";
    Video_ChannelStack_Update_Column["CloudFrontDistributionId"] = "cloudFrontDistributionId";
    Video_ChannelStack_Update_Column["CloudFrontDomain"] = "cloudFrontDomain";
    Video_ChannelStack_Update_Column["ConferenceId"] = "conferenceId";
    Video_ChannelStack_Update_Column["CreatedAt"] = "createdAt";
    Video_ChannelStack_Update_Column["EndpointUri"] = "endpointUri";
    Video_ChannelStack_Update_Column["Id"] = "id";
    Video_ChannelStack_Update_Column["LoopingMp4InputAttachmentName"] = "loopingMp4InputAttachmentName";
    Video_ChannelStack_Update_Column["MediaLiveChannelId"] = "mediaLiveChannelId";
    Video_ChannelStack_Update_Column["MediaPackageChannelId"] = "mediaPackageChannelId";
    Video_ChannelStack_Update_Column["Mp4InputAttachmentName"] = "mp4InputAttachmentName";
    Video_ChannelStack_Update_Column["Mp4InputId"] = "mp4InputId";
    Video_ChannelStack_Update_Column["RoomId"] = "roomId";
    Video_ChannelStack_Update_Column["RtmpAInputAttachmentName"] = "rtmpAInputAttachmentName";
    Video_ChannelStack_Update_Column["RtmpAInputId"] = "rtmpAInputId";
    Video_ChannelStack_Update_Column["RtmpAInputUri"] = "rtmpAInputUri";
    Video_ChannelStack_Update_Column["RtmpBInputAttachmentName"] = "rtmpBInputAttachmentName";
    Video_ChannelStack_Update_Column["RtmpBInputId"] = "rtmpBInputId";
    Video_ChannelStack_Update_Column["RtmpBInputUri"] = "rtmpBInputUri";
    Video_ChannelStack_Update_Column["RtmpOutputDestinationId"] = "rtmpOutputDestinationId";
    Video_ChannelStack_Update_Column["RtmpOutputStreamKey"] = "rtmpOutputStreamKey";
    Video_ChannelStack_Update_Column["RtmpOutputUri"] = "rtmpOutputUri";
    Video_ChannelStack_Update_Column["UpdatedAt"] = "updatedAt";
})(Video_ChannelStack_Update_Column = exports.Video_ChannelStack_Update_Column || (exports.Video_ChannelStack_Update_Column = {}));
var Video_EventVonageSession_Constraint;
(function (Video_EventVonageSession_Constraint) {
    Video_EventVonageSession_Constraint["EventVonageSessionEventIdKey"] = "EventVonageSession_eventId_key";
    Video_EventVonageSession_Constraint["EventVonageSessionPkey"] = "EventVonageSession_pkey";
    Video_EventVonageSession_Constraint["EventVonageSessionSessionIdKey"] = "EventVonageSession_sessionId_key";
})(Video_EventVonageSession_Constraint = exports.Video_EventVonageSession_Constraint || (exports.Video_EventVonageSession_Constraint = {}));
var Video_EventVonageSession_Select_Column;
(function (Video_EventVonageSession_Select_Column) {
    Video_EventVonageSession_Select_Column["ConferenceId"] = "conferenceId";
    Video_EventVonageSession_Select_Column["CreatedAt"] = "createdAt";
    Video_EventVonageSession_Select_Column["EventId"] = "eventId";
    Video_EventVonageSession_Select_Column["Id"] = "id";
    Video_EventVonageSession_Select_Column["RtmpInputName"] = "rtmpInputName";
    Video_EventVonageSession_Select_Column["SessionId"] = "sessionId";
    Video_EventVonageSession_Select_Column["SubconferenceId"] = "subconferenceId";
    Video_EventVonageSession_Select_Column["UpdatedAt"] = "updatedAt";
})(Video_EventVonageSession_Select_Column = exports.Video_EventVonageSession_Select_Column || (exports.Video_EventVonageSession_Select_Column = {}));
var Video_EventVonageSession_Update_Column;
(function (Video_EventVonageSession_Update_Column) {
    Video_EventVonageSession_Update_Column["ConferenceId"] = "conferenceId";
    Video_EventVonageSession_Update_Column["CreatedAt"] = "createdAt";
    Video_EventVonageSession_Update_Column["EventId"] = "eventId";
    Video_EventVonageSession_Update_Column["Id"] = "id";
    Video_EventVonageSession_Update_Column["RtmpInputName"] = "rtmpInputName";
    Video_EventVonageSession_Update_Column["SessionId"] = "sessionId";
    Video_EventVonageSession_Update_Column["SubconferenceId"] = "subconferenceId";
    Video_EventVonageSession_Update_Column["UpdatedAt"] = "updatedAt";
})(Video_EventVonageSession_Update_Column = exports.Video_EventVonageSession_Update_Column || (exports.Video_EventVonageSession_Update_Column = {}));
var Video_ImmediateSwitch_Constraint;
(function (Video_ImmediateSwitch_Constraint) {
    Video_ImmediateSwitch_Constraint["ImmediateSwitchPkey"] = "ImmediateSwitch_pkey";
})(Video_ImmediateSwitch_Constraint = exports.Video_ImmediateSwitch_Constraint || (exports.Video_ImmediateSwitch_Constraint = {}));
var Video_ImmediateSwitch_Select_Column;
(function (Video_ImmediateSwitch_Select_Column) {
    Video_ImmediateSwitch_Select_Column["ConferenceId"] = "conferenceId";
    Video_ImmediateSwitch_Select_Column["CreatedAt"] = "createdAt";
    Video_ImmediateSwitch_Select_Column["Data"] = "data";
    Video_ImmediateSwitch_Select_Column["ErrorMessage"] = "errorMessage";
    Video_ImmediateSwitch_Select_Column["EventId"] = "eventId";
    Video_ImmediateSwitch_Select_Column["ExecutedAt"] = "executedAt";
    Video_ImmediateSwitch_Select_Column["Id"] = "id";
    Video_ImmediateSwitch_Select_Column["SubconferenceId"] = "subconferenceId";
    Video_ImmediateSwitch_Select_Column["UpdatedAt"] = "updatedAt";
})(Video_ImmediateSwitch_Select_Column = exports.Video_ImmediateSwitch_Select_Column || (exports.Video_ImmediateSwitch_Select_Column = {}));
var Video_ImmediateSwitch_Update_Column;
(function (Video_ImmediateSwitch_Update_Column) {
    Video_ImmediateSwitch_Update_Column["ConferenceId"] = "conferenceId";
    Video_ImmediateSwitch_Update_Column["CreatedAt"] = "createdAt";
    Video_ImmediateSwitch_Update_Column["Data"] = "data";
    Video_ImmediateSwitch_Update_Column["ErrorMessage"] = "errorMessage";
    Video_ImmediateSwitch_Update_Column["EventId"] = "eventId";
    Video_ImmediateSwitch_Update_Column["ExecutedAt"] = "executedAt";
    Video_ImmediateSwitch_Update_Column["Id"] = "id";
    Video_ImmediateSwitch_Update_Column["SubconferenceId"] = "subconferenceId";
    Video_ImmediateSwitch_Update_Column["UpdatedAt"] = "updatedAt";
})(Video_ImmediateSwitch_Update_Column = exports.Video_ImmediateSwitch_Update_Column || (exports.Video_ImmediateSwitch_Update_Column = {}));
var Video_InputType_Constraint;
(function (Video_InputType_Constraint) {
    Video_InputType_Constraint["InputTypeNamePkey"] = "InputTypeName_pkey";
})(Video_InputType_Constraint = exports.Video_InputType_Constraint || (exports.Video_InputType_Constraint = {}));
var Video_InputType_Select_Column;
(function (Video_InputType_Select_Column) {
    Video_InputType_Select_Column["Description"] = "description";
    Video_InputType_Select_Column["Name"] = "name";
})(Video_InputType_Select_Column = exports.Video_InputType_Select_Column || (exports.Video_InputType_Select_Column = {}));
var Video_InputType_Update_Column;
(function (Video_InputType_Update_Column) {
    Video_InputType_Update_Column["Description"] = "description";
    Video_InputType_Update_Column["Name"] = "name";
})(Video_InputType_Update_Column = exports.Video_InputType_Update_Column || (exports.Video_InputType_Update_Column = {}));
var Video_MediaLiveChannelStatus_Constraint;
(function (Video_MediaLiveChannelStatus_Constraint) {
    Video_MediaLiveChannelStatus_Constraint["MediaLiveChannelStatusChannelStackIdKey"] = "MediaLiveChannelStatus_channelStackId_key";
    Video_MediaLiveChannelStatus_Constraint["MediaLiveChannelStatusPkey"] = "MediaLiveChannelStatus_pkey";
})(Video_MediaLiveChannelStatus_Constraint = exports.Video_MediaLiveChannelStatus_Constraint || (exports.Video_MediaLiveChannelStatus_Constraint = {}));
var Video_MediaLiveChannelStatus_Select_Column;
(function (Video_MediaLiveChannelStatus_Select_Column) {
    Video_MediaLiveChannelStatus_Select_Column["ActiveInputAttachmentName"] = "activeInputAttachmentName";
    Video_MediaLiveChannelStatus_Select_Column["ActiveInputSwitchActionName"] = "activeInputSwitchActionName";
    Video_MediaLiveChannelStatus_Select_Column["ChannelStackId"] = "channelStackId";
    Video_MediaLiveChannelStatus_Select_Column["ConferenceId"] = "conferenceId";
    Video_MediaLiveChannelStatus_Select_Column["CreatedAt"] = "createdAt";
    Video_MediaLiveChannelStatus_Select_Column["Id"] = "id";
    Video_MediaLiveChannelStatus_Select_Column["PipelinesRunningCount"] = "pipelinesRunningCount";
    Video_MediaLiveChannelStatus_Select_Column["State"] = "state";
    Video_MediaLiveChannelStatus_Select_Column["UpdatedAt"] = "updatedAt";
})(Video_MediaLiveChannelStatus_Select_Column = exports.Video_MediaLiveChannelStatus_Select_Column || (exports.Video_MediaLiveChannelStatus_Select_Column = {}));
var Video_MediaLiveChannelStatus_Update_Column;
(function (Video_MediaLiveChannelStatus_Update_Column) {
    Video_MediaLiveChannelStatus_Update_Column["ActiveInputAttachmentName"] = "activeInputAttachmentName";
    Video_MediaLiveChannelStatus_Update_Column["ActiveInputSwitchActionName"] = "activeInputSwitchActionName";
    Video_MediaLiveChannelStatus_Update_Column["ChannelStackId"] = "channelStackId";
    Video_MediaLiveChannelStatus_Update_Column["ConferenceId"] = "conferenceId";
    Video_MediaLiveChannelStatus_Update_Column["CreatedAt"] = "createdAt";
    Video_MediaLiveChannelStatus_Update_Column["Id"] = "id";
    Video_MediaLiveChannelStatus_Update_Column["PipelinesRunningCount"] = "pipelinesRunningCount";
    Video_MediaLiveChannelStatus_Update_Column["State"] = "state";
    Video_MediaLiveChannelStatus_Update_Column["UpdatedAt"] = "updatedAt";
})(Video_MediaLiveChannelStatus_Update_Column = exports.Video_MediaLiveChannelStatus_Update_Column || (exports.Video_MediaLiveChannelStatus_Update_Column = {}));
var Video_RoomRtmpOutput_Constraint;
(function (Video_RoomRtmpOutput_Constraint) {
    Video_RoomRtmpOutput_Constraint["EventRtmpOutputPkey"] = "EventRtmpOutput_pkey";
    Video_RoomRtmpOutput_Constraint["RoomRtmpOutputRoomIdKey"] = "RoomRtmpOutput_roomId_key";
})(Video_RoomRtmpOutput_Constraint = exports.Video_RoomRtmpOutput_Constraint || (exports.Video_RoomRtmpOutput_Constraint = {}));
var Video_RoomRtmpOutput_Select_Column;
(function (Video_RoomRtmpOutput_Select_Column) {
    Video_RoomRtmpOutput_Select_Column["CreatedAt"] = "created_at";
    Video_RoomRtmpOutput_Select_Column["Id"] = "id";
    Video_RoomRtmpOutput_Select_Column["RoomId"] = "roomId";
    Video_RoomRtmpOutput_Select_Column["StreamKey"] = "streamKey";
    Video_RoomRtmpOutput_Select_Column["UpdatedAt"] = "updated_at";
    Video_RoomRtmpOutput_Select_Column["Url"] = "url";
})(Video_RoomRtmpOutput_Select_Column = exports.Video_RoomRtmpOutput_Select_Column || (exports.Video_RoomRtmpOutput_Select_Column = {}));
var Video_RoomRtmpOutput_Update_Column;
(function (Video_RoomRtmpOutput_Update_Column) {
    Video_RoomRtmpOutput_Update_Column["CreatedAt"] = "created_at";
    Video_RoomRtmpOutput_Update_Column["Id"] = "id";
    Video_RoomRtmpOutput_Update_Column["RoomId"] = "roomId";
    Video_RoomRtmpOutput_Update_Column["StreamKey"] = "streamKey";
    Video_RoomRtmpOutput_Update_Column["UpdatedAt"] = "updated_at";
    Video_RoomRtmpOutput_Update_Column["Url"] = "url";
})(Video_RoomRtmpOutput_Update_Column = exports.Video_RoomRtmpOutput_Update_Column || (exports.Video_RoomRtmpOutput_Update_Column = {}));
var Video_RtmpInput_Constraint;
(function (Video_RtmpInput_Constraint) {
    Video_RtmpInput_Constraint["RtmpInputPkey"] = "RtmpInput_pkey";
})(Video_RtmpInput_Constraint = exports.Video_RtmpInput_Constraint || (exports.Video_RtmpInput_Constraint = {}));
var Video_RtmpInput_Enum;
(function (Video_RtmpInput_Enum) {
    Video_RtmpInput_Enum["RtmpA"] = "RTMP_A";
    Video_RtmpInput_Enum["RtmpB"] = "RTMP_B";
})(Video_RtmpInput_Enum = exports.Video_RtmpInput_Enum || (exports.Video_RtmpInput_Enum = {}));
var Video_RtmpInput_Select_Column;
(function (Video_RtmpInput_Select_Column) {
    Video_RtmpInput_Select_Column["Description"] = "description";
    Video_RtmpInput_Select_Column["Name"] = "name";
})(Video_RtmpInput_Select_Column = exports.Video_RtmpInput_Select_Column || (exports.Video_RtmpInput_Select_Column = {}));
var Video_RtmpInput_Update_Column;
(function (Video_RtmpInput_Update_Column) {
    Video_RtmpInput_Update_Column["Description"] = "description";
    Video_RtmpInput_Update_Column["Name"] = "name";
})(Video_RtmpInput_Update_Column = exports.Video_RtmpInput_Update_Column || (exports.Video_RtmpInput_Update_Column = {}));
var Video_TranscriptionJob_Constraint;
(function (Video_TranscriptionJob_Constraint) {
    Video_TranscriptionJob_Constraint["TranscriptionJobAwsTranscribeJobNameKey"] = "TranscriptionJob_awsTranscribeJobName_key";
    Video_TranscriptionJob_Constraint["TranscriptionJobPkey"] = "TranscriptionJob_pkey";
})(Video_TranscriptionJob_Constraint = exports.Video_TranscriptionJob_Constraint || (exports.Video_TranscriptionJob_Constraint = {}));
var Video_TranscriptionJob_Select_Column;
(function (Video_TranscriptionJob_Select_Column) {
    Video_TranscriptionJob_Select_Column["AwsTranscribeJobName"] = "awsTranscribeJobName";
    Video_TranscriptionJob_Select_Column["CreatedAt"] = "created_at";
    Video_TranscriptionJob_Select_Column["ElementId"] = "elementId";
    Video_TranscriptionJob_Select_Column["Id"] = "id";
    Video_TranscriptionJob_Select_Column["LanguageCode"] = "languageCode";
    Video_TranscriptionJob_Select_Column["TranscriptionS3Url"] = "transcriptionS3Url";
    Video_TranscriptionJob_Select_Column["UpdatedAt"] = "updated_at";
    Video_TranscriptionJob_Select_Column["VideoS3Url"] = "videoS3Url";
})(Video_TranscriptionJob_Select_Column = exports.Video_TranscriptionJob_Select_Column || (exports.Video_TranscriptionJob_Select_Column = {}));
var Video_TranscriptionJob_Update_Column;
(function (Video_TranscriptionJob_Update_Column) {
    Video_TranscriptionJob_Update_Column["AwsTranscribeJobName"] = "awsTranscribeJobName";
    Video_TranscriptionJob_Update_Column["CreatedAt"] = "created_at";
    Video_TranscriptionJob_Update_Column["ElementId"] = "elementId";
    Video_TranscriptionJob_Update_Column["Id"] = "id";
    Video_TranscriptionJob_Update_Column["LanguageCode"] = "languageCode";
    Video_TranscriptionJob_Update_Column["TranscriptionS3Url"] = "transcriptionS3Url";
    Video_TranscriptionJob_Update_Column["UpdatedAt"] = "updated_at";
    Video_TranscriptionJob_Update_Column["VideoS3Url"] = "videoS3Url";
})(Video_TranscriptionJob_Update_Column = exports.Video_TranscriptionJob_Update_Column || (exports.Video_TranscriptionJob_Update_Column = {}));
var Video_VideoRenderJob_Constraint;
(function (Video_VideoRenderJob_Constraint) {
    Video_VideoRenderJob_Constraint["VideoRenderJobPkey"] = "VideoRenderJob_pkey";
})(Video_VideoRenderJob_Constraint = exports.Video_VideoRenderJob_Constraint || (exports.Video_VideoRenderJob_Constraint = {}));
var Video_VideoRenderJob_Select_Column;
(function (Video_VideoRenderJob_Select_Column) {
    Video_VideoRenderJob_Select_Column["ConferenceId"] = "conferenceId";
    Video_VideoRenderJob_Select_Column["ConferencePrepareJobId"] = "conferencePrepareJobId";
    Video_VideoRenderJob_Select_Column["CreatedAt"] = "created_at";
    Video_VideoRenderJob_Select_Column["Data"] = "data";
    Video_VideoRenderJob_Select_Column["ElementId"] = "elementId";
    Video_VideoRenderJob_Select_Column["Id"] = "id";
    Video_VideoRenderJob_Select_Column["JobStatusName"] = "jobStatusName";
    Video_VideoRenderJob_Select_Column["Message"] = "message";
    Video_VideoRenderJob_Select_Column["RetriesCount"] = "retriesCount";
    Video_VideoRenderJob_Select_Column["UpdatedAt"] = "updated_at";
})(Video_VideoRenderJob_Select_Column = exports.Video_VideoRenderJob_Select_Column || (exports.Video_VideoRenderJob_Select_Column = {}));
var Video_VideoRenderJob_Update_Column;
(function (Video_VideoRenderJob_Update_Column) {
    Video_VideoRenderJob_Update_Column["ConferenceId"] = "conferenceId";
    Video_VideoRenderJob_Update_Column["ConferencePrepareJobId"] = "conferencePrepareJobId";
    Video_VideoRenderJob_Update_Column["CreatedAt"] = "created_at";
    Video_VideoRenderJob_Update_Column["Data"] = "data";
    Video_VideoRenderJob_Update_Column["ElementId"] = "elementId";
    Video_VideoRenderJob_Update_Column["Id"] = "id";
    Video_VideoRenderJob_Update_Column["JobStatusName"] = "jobStatusName";
    Video_VideoRenderJob_Update_Column["Message"] = "message";
    Video_VideoRenderJob_Update_Column["RetriesCount"] = "retriesCount";
    Video_VideoRenderJob_Update_Column["UpdatedAt"] = "updated_at";
})(Video_VideoRenderJob_Update_Column = exports.Video_VideoRenderJob_Update_Column || (exports.Video_VideoRenderJob_Update_Column = {}));
var Video_VonageParticipantStream_Constraint;
(function (Video_VonageParticipantStream_Constraint) {
    Video_VonageParticipantStream_Constraint["EventParticipantStreamPkey"] = "EventParticipantStream_pkey";
})(Video_VonageParticipantStream_Constraint = exports.Video_VonageParticipantStream_Constraint || (exports.Video_VonageParticipantStream_Constraint = {}));
var Video_VonageParticipantStream_Select_Column;
(function (Video_VonageParticipantStream_Select_Column) {
    Video_VonageParticipantStream_Select_Column["ConferenceId"] = "conferenceId";
    Video_VonageParticipantStream_Select_Column["CreatedAt"] = "createdAt";
    Video_VonageParticipantStream_Select_Column["Id"] = "id";
    Video_VonageParticipantStream_Select_Column["RegistrantId"] = "registrantId";
    Video_VonageParticipantStream_Select_Column["StoppedAt"] = "stopped_at";
    Video_VonageParticipantStream_Select_Column["SubconferenceId"] = "subconferenceId";
    Video_VonageParticipantStream_Select_Column["UpdatedAt"] = "updatedAt";
    Video_VonageParticipantStream_Select_Column["VonageConnectionId"] = "vonageConnectionId";
    Video_VonageParticipantStream_Select_Column["VonageSessionId"] = "vonageSessionId";
    Video_VonageParticipantStream_Select_Column["VonageStreamId"] = "vonageStreamId";
    Video_VonageParticipantStream_Select_Column["VonageStreamType"] = "vonageStreamType";
})(Video_VonageParticipantStream_Select_Column = exports.Video_VonageParticipantStream_Select_Column || (exports.Video_VonageParticipantStream_Select_Column = {}));
var Video_VonageParticipantStream_Update_Column;
(function (Video_VonageParticipantStream_Update_Column) {
    Video_VonageParticipantStream_Update_Column["ConferenceId"] = "conferenceId";
    Video_VonageParticipantStream_Update_Column["CreatedAt"] = "createdAt";
    Video_VonageParticipantStream_Update_Column["Id"] = "id";
    Video_VonageParticipantStream_Update_Column["RegistrantId"] = "registrantId";
    Video_VonageParticipantStream_Update_Column["StoppedAt"] = "stopped_at";
    Video_VonageParticipantStream_Update_Column["SubconferenceId"] = "subconferenceId";
    Video_VonageParticipantStream_Update_Column["UpdatedAt"] = "updatedAt";
    Video_VonageParticipantStream_Update_Column["VonageConnectionId"] = "vonageConnectionId";
    Video_VonageParticipantStream_Update_Column["VonageSessionId"] = "vonageSessionId";
    Video_VonageParticipantStream_Update_Column["VonageStreamId"] = "vonageStreamId";
    Video_VonageParticipantStream_Update_Column["VonageStreamType"] = "vonageStreamType";
})(Video_VonageParticipantStream_Update_Column = exports.Video_VonageParticipantStream_Update_Column || (exports.Video_VonageParticipantStream_Update_Column = {}));
var Video_VonageRoomRecording_Constraint;
(function (Video_VonageRoomRecording_Constraint) {
    Video_VonageRoomRecording_Constraint["VonageRoomRecordingPkey"] = "VonageRoomRecording_pkey";
})(Video_VonageRoomRecording_Constraint = exports.Video_VonageRoomRecording_Constraint || (exports.Video_VonageRoomRecording_Constraint = {}));
var Video_VonageRoomRecording_Select_Column;
(function (Video_VonageRoomRecording_Select_Column) {
    Video_VonageRoomRecording_Select_Column["CreatedAt"] = "created_at";
    Video_VonageRoomRecording_Select_Column["EndedAt"] = "endedAt";
    Video_VonageRoomRecording_Select_Column["Id"] = "id";
    Video_VonageRoomRecording_Select_Column["InitiatedBy"] = "initiatedBy";
    Video_VonageRoomRecording_Select_Column["RoomId"] = "roomId";
    Video_VonageRoomRecording_Select_Column["S3Url"] = "s3Url";
    Video_VonageRoomRecording_Select_Column["StartedAt"] = "startedAt";
    Video_VonageRoomRecording_Select_Column["UpdatedAt"] = "updated_at";
    Video_VonageRoomRecording_Select_Column["UploadedAt"] = "uploaded_at";
    Video_VonageRoomRecording_Select_Column["VonageSessionId"] = "vonageSessionId";
})(Video_VonageRoomRecording_Select_Column = exports.Video_VonageRoomRecording_Select_Column || (exports.Video_VonageRoomRecording_Select_Column = {}));
var Video_VonageRoomRecording_Update_Column;
(function (Video_VonageRoomRecording_Update_Column) {
    Video_VonageRoomRecording_Update_Column["CreatedAt"] = "created_at";
    Video_VonageRoomRecording_Update_Column["EndedAt"] = "endedAt";
    Video_VonageRoomRecording_Update_Column["Id"] = "id";
    Video_VonageRoomRecording_Update_Column["InitiatedBy"] = "initiatedBy";
    Video_VonageRoomRecording_Update_Column["RoomId"] = "roomId";
    Video_VonageRoomRecording_Update_Column["S3Url"] = "s3Url";
    Video_VonageRoomRecording_Update_Column["StartedAt"] = "startedAt";
    Video_VonageRoomRecording_Update_Column["UpdatedAt"] = "updated_at";
    Video_VonageRoomRecording_Update_Column["UploadedAt"] = "uploaded_at";
    Video_VonageRoomRecording_Update_Column["VonageSessionId"] = "vonageSessionId";
})(Video_VonageRoomRecording_Update_Column = exports.Video_VonageRoomRecording_Update_Column || (exports.Video_VonageRoomRecording_Update_Column = {}));
var Video_VonageSessionLayout_Constraint;
(function (Video_VonageSessionLayout_Constraint) {
    Video_VonageSessionLayout_Constraint["VonageSessionLayoutPkey"] = "VonageSessionLayout_pkey";
})(Video_VonageSessionLayout_Constraint = exports.Video_VonageSessionLayout_Constraint || (exports.Video_VonageSessionLayout_Constraint = {}));
var Video_VonageSessionLayout_Select_Column;
(function (Video_VonageSessionLayout_Select_Column) {
    Video_VonageSessionLayout_Select_Column["ConferenceId"] = "conferenceId";
    Video_VonageSessionLayout_Select_Column["CreatedAt"] = "created_at";
    Video_VonageSessionLayout_Select_Column["Id"] = "id";
    Video_VonageSessionLayout_Select_Column["LayoutData"] = "layoutData";
    Video_VonageSessionLayout_Select_Column["SubconferenceId"] = "subconferenceId";
    Video_VonageSessionLayout_Select_Column["UpdatedAt"] = "updated_at";
    Video_VonageSessionLayout_Select_Column["VonageSessionId"] = "vonageSessionId";
})(Video_VonageSessionLayout_Select_Column = exports.Video_VonageSessionLayout_Select_Column || (exports.Video_VonageSessionLayout_Select_Column = {}));
var Video_VonageSessionLayout_Update_Column;
(function (Video_VonageSessionLayout_Update_Column) {
    Video_VonageSessionLayout_Update_Column["ConferenceId"] = "conferenceId";
    Video_VonageSessionLayout_Update_Column["CreatedAt"] = "created_at";
    Video_VonageSessionLayout_Update_Column["Id"] = "id";
    Video_VonageSessionLayout_Update_Column["LayoutData"] = "layoutData";
    Video_VonageSessionLayout_Update_Column["SubconferenceId"] = "subconferenceId";
    Video_VonageSessionLayout_Update_Column["UpdatedAt"] = "updated_at";
    Video_VonageSessionLayout_Update_Column["VonageSessionId"] = "vonageSessionId";
})(Video_VonageSessionLayout_Update_Column = exports.Video_VonageSessionLayout_Update_Column || (exports.Video_VonageSessionLayout_Update_Column = {}));
var Video_YouTubeUpload_Constraint;
(function (Video_YouTubeUpload_Constraint) {
    Video_YouTubeUpload_Constraint["YouTubeUploadPkey"] = "YouTubeUpload_pkey";
    Video_YouTubeUpload_Constraint["YouTubeUploadVideoIdKey"] = "YouTubeUpload_videoId_key";
})(Video_YouTubeUpload_Constraint = exports.Video_YouTubeUpload_Constraint || (exports.Video_YouTubeUpload_Constraint = {}));
var Video_YouTubeUpload_Select_Column;
(function (Video_YouTubeUpload_Select_Column) {
    Video_YouTubeUpload_Select_Column["ConferenceId"] = "conferenceId";
    Video_YouTubeUpload_Select_Column["CreatedAt"] = "createdAt";
    Video_YouTubeUpload_Select_Column["ElementId"] = "elementId";
    Video_YouTubeUpload_Select_Column["Id"] = "id";
    Video_YouTubeUpload_Select_Column["SubconferenceId"] = "subconferenceId";
    Video_YouTubeUpload_Select_Column["UpdatedAt"] = "updatedAt";
    Video_YouTubeUpload_Select_Column["UploadYouTubeVideoJobId"] = "uploadYouTubeVideoJobId";
    Video_YouTubeUpload_Select_Column["VideoId"] = "videoId";
    Video_YouTubeUpload_Select_Column["VideoPrivacyStatus"] = "videoPrivacyStatus";
    Video_YouTubeUpload_Select_Column["VideoStatus"] = "videoStatus";
    Video_YouTubeUpload_Select_Column["VideoTitle"] = "videoTitle";
})(Video_YouTubeUpload_Select_Column = exports.Video_YouTubeUpload_Select_Column || (exports.Video_YouTubeUpload_Select_Column = {}));
var Video_YouTubeUpload_Update_Column;
(function (Video_YouTubeUpload_Update_Column) {
    Video_YouTubeUpload_Update_Column["ConferenceId"] = "conferenceId";
    Video_YouTubeUpload_Update_Column["CreatedAt"] = "createdAt";
    Video_YouTubeUpload_Update_Column["ElementId"] = "elementId";
    Video_YouTubeUpload_Update_Column["Id"] = "id";
    Video_YouTubeUpload_Update_Column["SubconferenceId"] = "subconferenceId";
    Video_YouTubeUpload_Update_Column["UpdatedAt"] = "updatedAt";
    Video_YouTubeUpload_Update_Column["UploadYouTubeVideoJobId"] = "uploadYouTubeVideoJobId";
    Video_YouTubeUpload_Update_Column["VideoId"] = "videoId";
    Video_YouTubeUpload_Update_Column["VideoPrivacyStatus"] = "videoPrivacyStatus";
    Video_YouTubeUpload_Update_Column["VideoStatus"] = "videoStatus";
    Video_YouTubeUpload_Update_Column["VideoTitle"] = "videoTitle";
})(Video_YouTubeUpload_Update_Column = exports.Video_YouTubeUpload_Update_Column || (exports.Video_YouTubeUpload_Update_Column = {}));
exports.EmptyQueryDocument = graphql_tag_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    query EmptyQuery {\n        conference_Conference {\n            id\n        }\n    }\n"], ["\n    query EmptyQuery {\n        conference_Conference {\n            id\n        }\n    }\n"])));
exports.GetConferenceDocument = graphql_tag_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    query GetConference($id: uuid!) {\n        conference_Conference_by_pk(id: $id) {\n            id\n            conferenceVisibilityLevel\n            subconferences {\n                id\n            }\n        }\n    }\n"], ["\n    query GetConference($id: uuid!) {\n        conference_Conference_by_pk(id: $id) {\n            id\n            conferenceVisibilityLevel\n            subconferences {\n                id\n            }\n        }\n    }\n"])));
exports.GetConferenceRoomsDocument = graphql_tag_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n    query GetConferenceRooms($conferenceId: uuid!) {\n        room_Room(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: { _is_null: true } }) {\n            id\n            managementModeName\n        }\n    }\n"], ["\n    query GetConferenceRooms($conferenceId: uuid!) {\n        room_Room(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: { _is_null: true } }) {\n            id\n            managementModeName\n        }\n    }\n"])));
exports.GetRegistrantDocument = graphql_tag_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n    query GetRegistrant($id: uuid!) {\n        registrant_Registrant_by_pk(id: $id) {\n            id\n            conferenceRole\n            subconferenceMemberships {\n                id\n                subconferenceId\n                role\n            }\n        }\n    }\n"], ["\n    query GetRegistrant($id: uuid!) {\n        registrant_Registrant_by_pk(id: $id) {\n            id\n            conferenceRole\n            subconferenceMemberships {\n                id\n                subconferenceId\n                role\n            }\n        }\n    }\n"])));
exports.GetRoomDocument = graphql_tag_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n    query GetRoom($id: uuid!) {\n        room_Room_by_pk(id: $id) {\n            id\n            conferenceId\n            subconferenceId\n            managementModeName\n        }\n    }\n"], ["\n    query GetRoom($id: uuid!) {\n        room_Room_by_pk(id: $id) {\n            id\n            conferenceId\n            subconferenceId\n            managementModeName\n        }\n    }\n"])));
exports.GetRoomMembershipsDocument = graphql_tag_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n    query GetRoomMemberships($roomId: uuid!) {\n        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {\n            id\n            registrantId\n            personRoleName\n        }\n    }\n"], ["\n    query GetRoomMemberships($roomId: uuid!) {\n        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {\n            id\n            registrantId\n            personRoleName\n        }\n    }\n"])));
exports.GetSubconferenceDocument = graphql_tag_1.default(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n    query GetSubconference($id: uuid!) {\n        conference_Subconference_by_pk(id: $id) {\n            id\n            conferenceVisibilityLevel\n        }\n    }\n"], ["\n    query GetSubconference($id: uuid!) {\n        conference_Subconference_by_pk(id: $id) {\n            id\n            conferenceVisibilityLevel\n        }\n    }\n"])));
exports.GetSubconferenceRoomsDocument = graphql_tag_1.default(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n    query GetSubconferenceRooms($subconferenceId: uuid!) {\n        room_Room(where: { subconferenceId: { _eq: $subconferenceId } }) {\n            id\n            managementModeName\n        }\n    }\n"], ["\n    query GetSubconferenceRooms($subconferenceId: uuid!) {\n        room_Room(where: { subconferenceId: { _eq: $subconferenceId } }) {\n            id\n            managementModeName\n        }\n    }\n"])));
exports.GetUserDocument = graphql_tag_1.default(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n    query GetUser($id: String!) {\n        User_by_pk(id: $id) {\n            id\n            registrants {\n                id\n                conferenceId\n            }\n        }\n    }\n"], ["\n    query GetUser($id: String!) {\n        User_by_pk(id: $id) {\n            id\n            registrants {\n                id\n                conferenceId\n            }\n        }\n    }\n"])));
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGhxbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW5lcmF0ZWQvZ3JhcGhxbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0REFBOEI7QUFtSzlCLElBQVksZ0JBR1g7QUFIRCxXQUFZLGdCQUFnQjtJQUV4Qiw0Q0FBd0IsQ0FBQTtBQUM1QixDQUFDLEVBSFcsZ0JBQWdCLEdBQWhCLHdCQUFnQixLQUFoQix3QkFBZ0IsUUFHM0I7QUF5SUQsSUFBWSxtQkEyQlg7QUEzQkQsV0FBWSxtQkFBbUI7SUFFM0IsOENBQXVCLENBQUE7SUFFdkIsb0RBQTZCLENBQUE7SUFFN0Isb0RBQTZCLENBQUE7SUFFN0IsZ0NBQVMsQ0FBQTtJQUVULG9EQUE2QixDQUFBO0lBRTdCLDhEQUF1QyxDQUFBO0lBRXZDLHdDQUFpQixDQUFBO0lBRWpCLHNEQUErQixDQUFBO0lBRS9CLG9EQUE2QixDQUFBO0lBRTdCLHdDQUFpQixDQUFBO0lBRWpCLDBDQUFtQixDQUFBO0lBRW5CLDhDQUF1QixDQUFBO0lBRXZCLHdDQUFpQixDQUFBO0FBQ3JCLENBQUMsRUEzQlcsbUJBQW1CLEdBQW5CLDJCQUFtQixLQUFuQiwyQkFBbUIsUUEyQjlCO0FBZ0VELElBQVksbUJBMkJYO0FBM0JELFdBQVksbUJBQW1CO0lBRTNCLDhDQUF1QixDQUFBO0lBRXZCLG9EQUE2QixDQUFBO0lBRTdCLG9EQUE2QixDQUFBO0lBRTdCLGdDQUFTLENBQUE7SUFFVCxvREFBNkIsQ0FBQTtJQUU3Qiw4REFBdUMsQ0FBQTtJQUV2Qyx3Q0FBaUIsQ0FBQTtJQUVqQixzREFBK0IsQ0FBQTtJQUUvQixvREFBNkIsQ0FBQTtJQUU3Qix3Q0FBaUIsQ0FBQTtJQUVqQiwwQ0FBbUIsQ0FBQTtJQUVuQiw4Q0FBdUIsQ0FBQTtJQUV2Qix3Q0FBaUIsQ0FBQTtBQUNyQixDQUFDLEVBM0JXLG1CQUFtQixHQUFuQiwyQkFBbUIsS0FBbkIsMkJBQW1CLFFBMkI5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