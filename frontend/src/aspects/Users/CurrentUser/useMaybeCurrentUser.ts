import React from "react";
import type { UserInfoFragment } from "../../../generated/graphql";

export type UserInfo = {
    loading: boolean;
    /**
     * The current user, if found.
     *
     * @returns
     * `false` if there is an error or if the user is not found in the database.
     * `undefined` if the result is still loading.
     * `UserInfoFragment` if the user was found.
     */
    user: UserInfoFragment | false | undefined;
    refetchUser: () => void;
};

export const defaultCurrentUserContext: UserInfo = {
    loading: true,
    user: undefined,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    refetchUser: async function (): Promise<void> {},
};

export const CurrentUserContext = React.createContext<UserInfo>(defaultCurrentUserContext);

export default function useMaybeCurrentUser(): UserInfo {
    return React.useContext(CurrentUserContext);
}
