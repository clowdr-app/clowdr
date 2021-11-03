type Maybe<T> = T | null;

type jsonb = any;

type uuid = string;

type SampleInput = {
    username: string;
    password: string;
};

type EchoInput = {
    message: string;
};

type SubmitElementInput = {
    elementData: jsonb;
};

type ConfirmInvitationInput = {
    inviteCode: uuid;
    confirmationCode: string;
};

type InvitationConfirmationEmailInput = {
    inviteCode: uuid;
};

type SubmitUpdatedSubtitlesInput = {
    elementId: string;
    subtitleText: string;
    accessToken: string;
};

type SampleOutput = {
    accessToken: string;
};

type EchoOutput = {
    message: string;
};

type ProtectedEchoOutput = {
    message: string;
};

type SubmitElementOutput = {
    success: boolean;
    message: string;
};

type ConfirmInvitationOutput = {
    ok: string;
    confSlug?: Maybe<string>;
};

type InvitationConfirmationEmailOutput = {
    sent: boolean;
};

type InvitationSendEmailResult = {
    registrantId: string;
    sent: boolean;
};

type SubmitUpdatedSubtitlesOutput = {
    success: boolean;
    message: string;
};

type GetUploadAgreementOutput = {
    agreementText?: Maybe<string>;
    agreementUrl?: Maybe<string>;
};

type ConferencePrepareOutput = {
    success: boolean;
    message?: Maybe<string>;
};

type UploaderSendSubmissionRequestResult = {
    uploaderId: uuid;
    sent: boolean;
};

type JoinEventVonageSessionOutput = {
    accessToken?: Maybe<string>;
    isRecorded?: Maybe<boolean>;
};

type JoinRoomVonageSessionOutput = {
    sessionId?: Maybe<string>;
    accessToken?: Maybe<string>;
    message?: Maybe<string>;
    isRecorded?: Maybe<boolean>;
};

type ProfilePhotoURLResponse = {
    url: string;
};

type UpdateProfilePhotoResponse = {
    ok: boolean;
    photoURL_350x350?: Maybe<string>;
    photoURL_50x50?: Maybe<string>;
};

type CreateRoomDmOutput = {
    roomId?: Maybe<uuid>;
    chatId?: Maybe<uuid>;
    message?: Maybe<string>;
};

type CreateContentGroupRoomOutput = {
    roomId?: Maybe<string>;
    message?: Maybe<string>;
};

type StopEventBroadcastOutput = {
    broadcastsStopped: number;
};

type GetGoogleOAuthUrlOutput = {
    url: string;
};

type SubmitGoogleOAuthTokenOutput = {
    success: boolean;
    message?: Maybe<string>;
};

type SubmitGoogleOAuthCodeOutput = {
    success: boolean;
    message?: Maybe<string>;
};

type RefreshYouTubeDataOutput = {
    success: boolean;
    message?: Maybe<string>;
};

type ChatRemoteToken = {
    jwt: string;
    expiry: number;
};

type GenerateChatRemoteServiceIdsOutput = {
    error?: Maybe<string>;
};

type GenerateChatRemoteUserIdsOutput = {
    error?: Maybe<string>;
};

type PresenceSummaryOutput = {
    total_unique_tabs: number;
    total_unique_user_ids: number;
    pages?: Maybe<jsonb>;
};

type PresenceFlushOutput = {
    ok?: Maybe<string>;
};

type JoinRoomChimeSessionOutput = {
    meeting?: Maybe<jsonb>;
    registrant?: Maybe<jsonb>;
    message?: Maybe<string>;
};

type Query = {
    echo?: Maybe<EchoOutput>;
    getSlug?: Maybe<GetSlugOutput>;
    getUploadAgreement?: Maybe<GetUploadAgreementOutput>;
    presence_Summary?: Maybe<PresenceSummaryOutput>;
    protectedEcho?: Maybe<ProtectedEchoOutput>;
};

type Mutation = {
    createContentGroupRoom?: Maybe<CreateContentGroupRoomOutput>;
    createRoomDm?: Maybe<CreateRoomDmOutput>;
    generateChatRemoteServiceIds?: Maybe<GenerateChatRemoteServiceIdsOutput>;
    generateChatRemoteToken?: Maybe<ChatRemoteToken>;
    generateChatRemoteUserIds?: Maybe<GenerateChatRemoteUserIdsOutput>;
    getGoogleOAuthUrl?: Maybe<GetGoogleOAuthUrlOutput>;
    invitationConfirmCurrent?: Maybe<ConfirmInvitationOutput>;
    invitationConfirmSendInitialEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmSendRepeatEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmWithCode?: Maybe<ConfirmInvitationOutput>;
    joinEventVonageSession?: Maybe<JoinEventVonageSessionOutput>;
    joinRoomChimeSession?: Maybe<JoinRoomChimeSessionOutput>;
    joinRoomVonageSession?: Maybe<JoinRoomVonageSessionOutput>;
    presence_Flush: PresenceFlushOutput;
    refreshYouTubeData?: Maybe<RefreshYouTubeDataOutput>;
    stopEventBroadcast?: Maybe<StopEventBroadcastOutput>;
    submitElement?: Maybe<SubmitElementOutput>;
    submitGoogleOAuthCode?: Maybe<SubmitGoogleOAuthCodeOutput>;
    updateProfilePhoto?: Maybe<UpdateProfilePhotoResponse>;
    updateSubtitles?: Maybe<SubmitUpdatedSubtitlesOutput>;
};

type echoArgs = {
    message: string;
};

type getElementArgs = {
    magicToken: string;
};

type getUploadAgreementArgs = {
    magicToken: string;
};

type presence_SummaryArgs = {};

type protectedEchoArgs = {
    message: string;
};

type createContentGroupRoomArgs = {
    itemId: uuid;
    conferenceId: uuid;
};

type createRoomDmArgs = {
    conferenceId: uuid;
    registrantIds: Array<uuid>;
};

type generateChatRemoteServiceIdsArgs = {};

type generateChatRemoteTokenArgs = {
    registrantId: uuid;
};

type generateChatRemoteUserIdsArgs = {};

type getGoogleOAuthUrlArgs = {
    registrantId: uuid;
    scopes: Array<string>;
};

type invitationConfirmCurrentArgs = {
    inviteCode: uuid;
};

type invitationConfirmSendInitialEmailArgs = {
    inviteInput: InvitationConfirmationEmailInput;
};

type invitationConfirmSendRepeatEmailArgs = {
    inviteInput: InvitationConfirmationEmailInput;
};

type invitationConfirmWithCodeArgs = {
    inviteInput: ConfirmInvitationInput;
};

type joinEventVonageSessionArgs = {
    eventId: uuid;
};

type joinRoomChimeSessionArgs = {
    roomId: uuid;
};

type joinRoomVonageSessionArgs = {
    roomId: uuid;
};

type presence_FlushArgs = {};

type refreshYouTubeDataArgs = {
    registrantId: uuid;
    registrantGoogleAccountId: uuid;
};

type stopEventBroadcastArgs = {
    eventId: uuid;
};

type submitElementArgs = {
    data: jsonb;
    magicToken: string;
};

type submitGoogleOAuthCodeArgs = {
    code: string;
    state: string;
};

type updateProfilePhotoArgs = {
    registrantId: uuid;
    s3URL?: Maybe<string>;
};

type updateSubtitlesArgs = {
    elementId: string;
    subtitleText: string;
    magicToken: string;
};

type getSlugArgs = {
    url: string;
};

type GetSlugOutput = {
    slug?: Maybe<string>;
};

type getProgramPersonAccessTokenArgs = {
    elementId: uuid;
    uploaderEmail: string;
    elementAccessToken: string;
};

type MatchingPersonOutput = {
    accessToken?: Maybe<string>;
};

type toggleVonageRecordingStateArgs = {
    recordingActive: boolean;
    vonageSessionId: string;
};

type ToggleVonageRecordingStateOutput = {
    allowed: boolean;
    recordingState: boolean;
};

type InitialiseSuperUserOutput = {
    success: boolean;
    error?: Maybe<string>;
};
