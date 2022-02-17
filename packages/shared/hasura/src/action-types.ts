export type Maybe<T> = T | null;

export type jsonb = any;

export type uuid = string;

export type SubmitElementInput = {
    elementData: jsonb;
};

export type ConfirmInvitationInput = {
    inviteCode: uuid;
    confirmationCode: string;
};

export type InvitationConfirmationEmailInput = {
    inviteCode: uuid;
};

export type SubmitUpdatedSubtitlesInput = {
    elementId: string;
    subtitleText: string;
    accessToken: string;
};

export type SubmitElementOutput = {
    success: boolean;
    message: string;
};

export type ConfirmInvitationOutput = {
    ok: string;
    confSlug?: Maybe<string>;
};

export type InvitationConfirmationEmailOutput = {
    sent: boolean;
};

export type InvitationSendEmailResult = {
    registrantId: string;
    sent: boolean;
};

export type SubmitUpdatedSubtitlesOutput = {
    success: boolean;
    message: string;
};

export type GetUploadAgreementOutput = {
    agreementText?: Maybe<string>;
    agreementUrl?: Maybe<string>;
};

export type ConferencePrepareOutput = {
    success: boolean;
    message?: Maybe<string>;
};

export type UploaderSendSubmissionRequestResult = {
    uploaderId: uuid;
    sent: boolean;
};

export type JoinEventVonageSessionOutput = {
    accessToken?: Maybe<string>;
    isRecorded?: Maybe<boolean>;
};

export type JoinRoomVonageSessionOutput = {
    sessionId?: Maybe<string>;
    accessToken?: Maybe<string>;
    message?: Maybe<string>;
    isRecorded?: Maybe<boolean>;
};

export type ProfilePhotoURLResponse = {
    url: string;
};

export type UpdateConferenceLogoResponse = {
    ok: boolean
    url?: Maybe<string>
}

export type UpdateProfilePhotoResponse = {
    ok: boolean;
    photoURL_350x350?: Maybe<string>;
    photoURL_50x50?: Maybe<string>;
};

export type CreateRoomDmOutput = {
    roomId?: Maybe<uuid>;
    chatId?: Maybe<uuid>;
    message?: Maybe<string>;
};

export type CreateContentGroupRoomOutput = {
    roomId?: Maybe<string>;
    message?: Maybe<string>;
};

export type StopEventBroadcastOutput = {
    broadcastsStopped: number;
};

export type GetGoogleOAuthUrlOutput = {
    url: string;
};

export type SubmitGoogleOAuthTokenOutput = {
    success: boolean;
    message?: Maybe<string>;
};

export type SubmitGoogleOAuthCodeOutput = {
    success: boolean;
    message?: Maybe<string>;
};

export type RefreshYouTubeDataOutput = {
    success: boolean;
    message?: Maybe<string>;
};

export type ChatRemoteToken = {
    jwt: string;
    expiry: number;
};

export type GenerateChatRemoteServiceIdsOutput = {
    error?: Maybe<string>;
};

export type GenerateChatRemoteUserIdsOutput = {
    error?: Maybe<string>;
};

export type PresenceSummaryOutput = {
    total_unique_tabs: number;
    total_unique_user_ids: number;
    pages?: Maybe<jsonb>;
};

export type PresenceFlushOutput = {
    ok?: Maybe<string>;
};

export type JoinRoomChimeSessionOutput = {
    meeting?: Maybe<jsonb>;
    registrant?: Maybe<jsonb>;
    message?: Maybe<string>;
};

export type VAPIDPublicKeyOutput = {
    key: string
}

export type Query = {
    getSlug: GetSlugOutput
    getUploadAgreement?: Maybe<GetUploadAgreementOutput>
    presence_Summary?: Maybe<PresenceSummaryOutput>
    transcribeGeneratePresignedUrl: TranscribeGeneratePresignedUrlOutput
    vapidPublicKey: VAPIDPublicKeyOutput
}

export type Mutation = {
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
    updateConferenceLogo?: Maybe<UpdateConferenceLogoResponse>;
    updateProfilePhoto?: Maybe<UpdateProfilePhotoResponse>;
    updateSubtitles?: Maybe<SubmitUpdatedSubtitlesOutput>;
};

export type getUploadAgreementArgs = Record<string, never>;

export type presence_SummaryArgs = Record<string, never>;

export type createContentGroupRoomArgs = {
    itemId: uuid;
    conferenceId: uuid;
};

export type createRoomDmArgs = {
    conferenceId: uuid;
    registrantIds: Array<uuid>;
};

export type generateChatRemoteServiceIdsArgs = Record<string, never>;

export type generateChatRemoteTokenArgs = {
    registrantId: uuid;
};

export type generateChatRemoteUserIdsArgs = Record<string, never>;

export type getGoogleOAuthUrlArgs = {
    registrantId: uuid;
    scopes: Array<string>;
};

export type invitationConfirmCurrentArgs = {
    inviteCode: uuid;
};

export type joinEventVonageSessionArgs = {
    registrantId: uuid;
    eventId: uuid;
};

export type joinRoomChimeSessionArgs = {
    registrantId: uuid;
    roomId: uuid;
};

export type joinRoomVonageSessionArgs = {
    registrantId: uuid;
    roomId: uuid;
};

export type presence_FlushArgs = Record<string, never>;

export type refreshYouTubeDataArgs = {
    registrantId: uuid;
    registrantGoogleAccountId: uuid;
};

export type stopEventBroadcastArgs = {
    eventId: uuid;
};

export type submitElementArgs = {
    data: jsonb;
    magicToken: string;
    elementId: string;
};

export type submitGoogleOAuthCodeArgs = {
    code: string;
    state: string;
};

export type updateConferenceLogoArgs = {
    conferenceId: uuid
    url?: Maybe<string>
}

export type updateProfilePhotoArgs = {
    registrantId: uuid;
    s3URL?: Maybe<string>;
};

export type updateSubtitlesArgs = {
    elementId: string;
    subtitleText: string;
    magicToken: string;
};

export type getSlugArgs = {
    url: string;
};

export type GetSlugOutput = {
    slug?: Maybe<string>;
};

export type TranscribeGeneratePresignedUrlArgs = {
    languageCode: string;
    sampleRate: string;
};

export type TranscribeGeneratePresignedUrlOutput = {
    url: string;
};

export type MatchingPersonOutput = {
    accessToken?: Maybe<string>;
};

export type toggleVonageRecordingStateArgs = {
    recordingActive: boolean;
    vonageSessionId: string;
};

export type ToggleVonageRecordingStateOutput = {
    allowed: boolean;
    recordingState: boolean;
};

export type InitialiseSuperUserOutput = {
    success: boolean;
    error?: Maybe<string>;
};
