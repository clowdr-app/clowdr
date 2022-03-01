import React from "react";
import { Redirect } from "react-router-dom";
import ListConferencesView from "./ListConferencesView";
import useCurrentUser from "./useCurrentUser";
import useCurrentUserRegistrants, { CurrentUserRegistrantsProvider } from "./useCurrentUserRegistrants";

export default function CurrentUserPage(): JSX.Element {
    const { user } = useCurrentUser();

    return (
        <CurrentUserRegistrantsProvider userId={user.id}>
            <CurrentUserPageInner />
        </CurrentUserRegistrantsProvider>
    );
}

function CurrentUserPageInner(): JSX.Element {
    const registrants = useCurrentUserRegistrants();
    if (registrants.length > 0) {
        return <ListConferencesView />;
    } else {
        return <Redirect to="/join" />;
    }
}
