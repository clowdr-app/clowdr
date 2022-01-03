import assert from "assert";
import React from "react";
import type { SelectCurrentUserQuery } from "../../../generated/graphql";
import { CurrentUserContext } from "./useMaybeCurrentUser";
import { useIntl } from "react-intl";

export default function useCurrentUser(): {
    user: NonNullable<SelectCurrentUserQuery["User_by_pk"]>;
    refetchUser: () => Promise<unknown>;
} {
    const intl = useIntl();
    const info = React.useContext(CurrentUserContext);
    assert(info.user, intl.formatMessage({ id: 'users.currentuser.usecurrentuser.notavaiable', defaultMessage: "Current user not available" }));
    return {
        ...info,
        user: info.user,
    };
}
