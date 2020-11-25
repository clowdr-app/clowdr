import React from "react";
import type { SelectCurrentUserQuery } from "../../../generated/graphql";

type UserInfo = {
    user: SelectCurrentUserQuery | false | undefined;
    refetchUser: () => Promise<unknown>;
};

export const defaultCurrentUserContext: UserInfo = {
    user: undefined,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    refetchUser: async function (): Promise<void> {},
};

export const CurrentUserContext = React.createContext<UserInfo>(
    defaultCurrentUserContext
);

export default function useMaybeCurrentUser(): UserInfo {
    return React.useContext(CurrentUserContext);
}
