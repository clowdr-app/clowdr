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
