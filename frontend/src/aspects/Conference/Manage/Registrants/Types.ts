export type RegistrantDescriptor = {
    isNew: boolean;
    id: string;
    userId?: string | null;
    displayName: string;
    invitedEmailAddress?: string;
    inviteSent: boolean;
    inviteCode?: string;
    groupIds: Set<string>;
};
