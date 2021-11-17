/** @summary Input headers (unverified) to the auth service. */
export enum AuthHeader {
    Role = "X-Auth-Role",

    ConferenceId = "X-Auth-Conference-Id",
    SubconferenceId = "X-Auth-Subconference-Id",
    RoomId = "X-Auth-Room-Id",
    MagicToken = "X-Auth-Magic-Token",
    InviteCode = "X-Auth-Invite-Code",
    IncludeRoomIds = "X-Auth-Include-Room-Ids",
}

/** @summary Roles configured in Hasura. */
export enum HasuraRoleName {
    User = "user",
    Unauthenticated = "unauthenticated",
    ConferenceOrganizer = "conference-organizer",
    SubconferenceOrganizer = "subconference-organizer",
    Moderator = "moderator",
    Attendee = "attendee",
    Submitter = "submitter",
    RoomAdmin = "room-admin",
    RoomMember = "room-member",
    Superuser = "superuser",
}
