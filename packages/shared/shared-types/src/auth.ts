/** @summary Input headers (unverified) to the auth service. */
export enum AuthHeader {
    Role = "X-Auth-Role",

    ConferenceId = "X-Auth-Conference-Id",
    SubconferenceId = "X-Auth-Subconference-Id",
    RoomId = "X-Auth-Room-Id",
    MagicToken = "X-Auth-Magic-Token",
    InviteCode = "X-Auth-Invite-Code",
    IncludeRoomIds = "X-Auth-Include-Room-Ids",

    RefreshRegistrationsCache = "X-Auth-RefreshRegistrationsCache",
}

/** @summary Roles configured in Hasura. */
export enum HasuraRoleName {
    User = "user",
    Unauthenticated = "unauthenticated",
    /**
     * Organiser of a top-level conference. This role does not grant access to
     * content of subconferences (even though this may in fact be granted to the user).
     */
    ConferenceOrganizer = "conference-organizer",
    /**
     * Organiser of a subconference. This role grants access only to the contents
     * of subconferences
     */
    SubconferenceOrganizer = "subconference-organizer",
    Moderator = "moderator",
    Attendee = "attendee",
    Submitter = "submitter",
    RoomAdmin = "room-admin",
    RoomMember = "room-member",
    Superuser = "superuser",
}
