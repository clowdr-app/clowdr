import React from "react";
import { Redirect } from "react-router-dom";
import { useNoPrimaryMenuButtons } from "../../Menu/usePrimaryMenuButtons";
import { getCachedInviteCode } from "../NewUser/InviteCodeLocalStorage";
import ListConferencesView from "./ListConferencesView";
import useCurrentUser from "./useCurrentUser";
import UseInviteOrCreateView from "./UseInviteOrCreateView";

function UseInviteCodeOrCreatePage(): JSX.Element {
    useNoPrimaryMenuButtons();

    return <UseInviteOrCreateView />;
}

export default function CurrentUserPage(): JSX.Element {
    const inviteCode = getCachedInviteCode();
    const { user } = useCurrentUser();

    if (inviteCode) {
        return <Redirect to={`/invitation/accept/${inviteCode}`} />;
    }

    if (user.attendees.length > 0) {
        return <ListConferencesView />;
    } else {
        return <UseInviteCodeOrCreatePage />;
    }
}
