type Maybe<T> = T | null;

type uuid = string;

type jsonb = string;

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

type Query = {
    echo?: Maybe<EchoOutput>;
    protectedEcho?: Maybe<ProtectedEchoOutput>;
};

type Mutation = {
    invitationConfirmCurrent?: Maybe<ConfirmInvitationOutput>;
    invitationConfirmSendInitialEmail?: Maybe<
        InvitationConfirmationEmailOutput
    >;
    invitationConfirmSendRepeatEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmWithCode?: Maybe<ConfirmInvitationOutput>;
    invitationSendInitialEmail: Array<InvitationSendEmailResult>;
    invitationSendRepeatEmail: Array<InvitationSendEmailResult>;
    submitContentItem?: Maybe<SubmitContentItemOutput>;
};

type echoArgs = {
    message: string;
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
