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

type GetContentItemOutput = {
    contentTypeName: string;
    id: string;
    name: string;
    data: jsonb;
    layoutData?: Maybe<jsonb>;
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
    getContentItem?: Maybe<Array<Maybe<GetContentItemOutput>>>;
    protectedEcho?: Maybe<ProtectedEchoOutput>;
};

type Mutation = {
    invitationConfirmCurrent?: Maybe<ConfirmInvitationOutput>;
    invitationConfirmSendInitialEmail?: Maybe<
        InvitationConfirmationEmailOutput
    >;
    invitationConfirmSendRepeatEmail?: Maybe<InvitationConfirmationEmailOutput>;
    invitationConfirmWithCode?: Maybe<ConfirmInvitationOutput>;
    submitContentItem?: Maybe<SubmitContentItemOutput>;
};

type echoArgs = {
    message: string;
};

type getContentItemArgs = {
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

type submitContentItemArgs = {
    data: jsonb;
    magicToken: string;
};
