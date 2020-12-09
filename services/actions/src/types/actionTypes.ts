type Maybe<T> = T | null;

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

type ConfirmInvitationOutput = {
    ok: boolean;
    confSlug?: string;
};

type InvitationConfirmationEmailOutput = {
    sent: boolean;
};

type SampleInput = {
    username: string;
    password: string;
};

type EchoInput = {
    message: string;
};

type ConfirmInvitationInput = {
    inviteCode: string;
    confirmationCode: string;
};

type InvitationConfirmationEmailInput = {
    inviteCode: string;
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
