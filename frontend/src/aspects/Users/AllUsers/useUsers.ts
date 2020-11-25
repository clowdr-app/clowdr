import React from "react";
import type { SelectUsersQuery } from "../../../generated/graphql";

type UserInfos = SelectUsersQuery | false | undefined;

export const UsersContext = React.createContext<UserInfos>(undefined);

export default function useUsers(): UserInfos {
    return React.useContext(UsersContext);
}
