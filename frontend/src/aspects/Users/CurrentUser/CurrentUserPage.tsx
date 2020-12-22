import React from "react";
import { Redirect } from "react-router-dom";
import { getCachedInviteCode } from "../NewUser/InviteCodeLocalStorage";
import ListConferencesView from "./ListConferencesView";
import useCurrentUser from "./useCurrentUser";

export default function CurrentUserPage(): JSX.Element {
    const inviteCode = getCachedInviteCode();
    const { user } = useCurrentUser();

    if (inviteCode) {
        return <Redirect to={`/invitation/accept/${inviteCode}`} />;
    }

    if (user.attendees.length > 0) {
        return <ListConferencesView />;
    } else {
        return <Redirect to="/conference/joinOrCreate" />;
    }
}
