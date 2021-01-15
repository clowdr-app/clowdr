type Maybe<T> = T | null;

type jsonb = any;

type uuid = string;

type SampleOutput = {
    accessToken: string;
};

type EchoOutput = {
    message: string;
};

type ProtectedEchoOutput = {
    message: string;
};

type SubmitContentItemOutput = {
    success: boolean;
    message: string;
};

type ConfirmInvitationOutput = {
    ok: boolean;
    confSlug?: Maybe<string>;
};

type InvitationConfirmationEmailOutput = {
    sent: boolean;
};

type InvitationSendEmailResult = {
    attendeeId: string;
    sent: boolean;
};

type GetContentItemOutput = {
    contentTypeName: string;
    name: string;
    id: string;
    data: jsonb;
    layoutData?: Maybe<jsonb>;
    contentGroupTitle: string;
};

type SubmitUpdatedSubtitlesOutput = {
    success: boolean;
    message: string;
};

type GetUploadAgreementOutput = {
    agreementText?: Maybe<string>;
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
};

type JoinRoomVonageSessionOutput = {
    sessionId?: Maybe<string>;
    accessToken?: Maybe<string>;
};

type ProfilePhotoURLResponse = {
    url: string;
};

type UpdateProfilePhotoResponse = {
    ok: boolean;
};

type CreateRoomDmOutput = {
    roomId?: Maybe<uuid>;
    message?: Maybe<string>;
};

type SampleInput = {
    username: string;
    password: string;
};

type EchoInput = {
    message: string;
};

type SubmitContentItemInput = {
    contentItemData: jsonb;
};

type ConfirmInvitationInput = {
    inviteCode: uuid;
    confirmationCode: string;
};

type InvitationConfirmationEmailInput = {
    inviteCode: uuid;
};

type SubmitUpdatedSubtitlesInput = {
    contentItemId: string;
    subtitleText: string;
    accessToken: string;
};

type Query = {
    echo?: Maybe<EchoOutput>;
    getContentItem?: Maybe<Array<Maybe<GetContentItemOutput>>>;
    getUploadAgreement?: Maybe<GetUploadAgreementOutput>;
    protectedEcho?: Maybe<ProtectedEchoOutput>;
};

type Mutation = {
    createRoomDm?: Maybe<CreateRoomDmOutput>;
    invitationConfirmCurrent?: Maybe<ConfirmInvitationOutput>;
    invitationConfirmSendInitialEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmSendRepeatEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmWithCode?: Maybe<ConfirmInvitationOutput>;
    joinEventVonageSession?: Maybe<JoinEventVonageSessionOutput>;
    joinRoomVonageSession?: Maybe<JoinRoomVonageSessionOutput>;
    submitContentItem?: Maybe<SubmitContentItemOutput>;
    updateProfilePhoto?: Maybe<UpdateProfilePhotoResponse>;
    updateSubtitles?: Maybe<SubmitUpdatedSubtitlesOutput>;
};

type echoArgs = {
    message: string;
};

type getContentItemArgs = {
    magicToken: string;
};

type getUploadAgreementArgs = {
    magicToken: string;
};

type protectedEchoArgs = {
    message: string;
};

type createRoomDmArgs = {
    conferenceId: uuid;
    attendeeIds: Array<uuid>;
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

type joinRoomVonageSessionArgs = {
    roomId: uuid;
};

type submitContentItemArgs = {
    data: jsonb;
    magicToken: string;
};

type updateProfilePhotoArgs = {
    attendeeId: uuid;
    s3URL?: Maybe<string>;
};

type updateSubtitlesArgs = {
    contentItemId: string;
    subtitleText: string;
    magicToken: string;
};
