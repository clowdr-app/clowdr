/** @summary Input headers (unverified) to the auth service. */
export enum AuthHeaders {
    Role = "X-Auth-Role",

    ConferenceId = "X-Auth-Conference-Id",
    SubconferenceId = "X-Auth-Subconference-Id",
    RoomId = "X-Auth-Room-Id",
    MagicToken = "X-Auth-Magic-Token",
    InviteCode = "X-Auth-Invite-Code",
    includeRoomIds = "X-Auth-Include-Room-Ids",
}
