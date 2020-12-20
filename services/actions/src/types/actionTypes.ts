type Maybe<T> = T | null;

// If you see "Invalid request"s occurring when they
//  shouldn't, maybe this type accidentally got assigned
//  to "string" instead of "any"? Hasura's CodeGen
//  generates the wrong type.
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
    invitationConfirmCurrent?: Maybe<ConfirmInvitationOutput>;
    invitationConfirmSendInitialEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmSendRepeatEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmWithCode?: Maybe<ConfirmInvitationOutput>;
    invitationSendInitialEmail: Array<InvitationSendEmailResult>;
    invitationSendRepeatEmail: Array<InvitationSendEmailResult>;
    submitContentItem?: Maybe<SubmitContentItemOutput>;
    updateSubtitles?: Maybe<SubmitUpdatedSubtitlesOutput>;
    uploadSendSubmissionRequests: Array<UploaderSendSubmissionRequestResult>;
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

type invitationSendInitialEmailArgs = {
    attendeeIds: Array<string>;
};

type invitationSendRepeatEmailArgs = {
    attendeeIds: Array<string>;
};

type submitContentItemArgs = {
    data: jsonb;
    magicToken: string;
};

type updateSubtitlesArgs = {
    contentItemId: string;
    subtitleText: string;
    magicToken: string;
};

type uploadSendSubmissionRequestsArgs = {
    uploaderIds: Array<uuid>;
};
