import React from "react";
import { Redirect } from "react-router-dom";
import ListConferencesView from "./ListConferencesView";
import useCurrentUser from "./useCurrentUser";

export default function CurrentUserPage(): JSX.Element {
    const { user } = useCurrentUser();

    if (user.registrants.length > 0) {
        return <ListConferencesView />;
    } else {
        return <Redirect to="/join" />;
    }
}
