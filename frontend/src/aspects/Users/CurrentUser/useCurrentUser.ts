import assert from "assert";
import React from "react";
import type { SelectCurrentUserQuery } from "../../../generated/graphql";
import { CurrentUserContext } from "./useMaybeCurrentUser";

export default function useCurrentUser(): {
    user: NonNullable<SelectCurrentUserQuery["User_by_pk"]>;
    refetchUser: () => Promise<unknown>;
} {
    const info = React.useContext(CurrentUserContext);
    assert(info.user, "Current user not available");
    return {
        ...info,
        user: info.user,
    };
}
