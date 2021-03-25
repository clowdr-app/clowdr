import React from "react";
import type { UserInfoFragment } from "../../../generated/graphql";

export type UserInfo = {
    loading: boolean;
    user: UserInfoFragment | false | undefined;
    refetchUser: () => Promise<unknown>;
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
