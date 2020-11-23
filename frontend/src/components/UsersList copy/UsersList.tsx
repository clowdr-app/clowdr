import { HStack, Spinner, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import useUsers from "../../hooks/Users/useUsers";
import Column from "../Columns/Column";
import FAIcon from "../fontawesome/FAIcon";

export default function UsersList(): JSX.Element {
    const users = useUsers();

    const column = useMemo(() => {
        if (users === undefined) {
            return <Spinner />;
        }
        if (users === false) {
            return <Text>Error!</Text>;
        }
        return (
            <Column
                title="Users"
                items={users.user}
                compareItems={(x, y) => {
                    const q = x.firstName.localeCompare(y.firstName);
                    if (q === 0) {
                        return x.lastName.localeCompare(y.lastName);
                    }
                    return q;
                }}
                renderItem={(user) => {
                    const isOnline =
                        user.onlineStatus &&
                        new Date(user.onlineStatus.lastSeen).getTime() >
                            Date.now() - 80 * 1000;
                    return (
                        <HStack key={user.id} width="100%">
                            <FAIcon
                                icon={
                                    user.onlineStatus === null
                                        ? "times-circle"
                                        : "circle"
                                }
                                iconStyle={isOnline ? "s" : "r"}
                                color={isOnline ? "#00ff00" : "#fcfcfc"}
                            />
                            <Text>
                                {user.firstName}&nbsp;{user.lastName}
                            </Text>
                        </HStack>
                    );
                }}
                filterItem={(search, item) => {
                    return (
                        item.firstName
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        item.lastName
                            .toLowerCase()
                            .includes(search.toLowerCase())
                    );
                }}
            />
        );
    }, [users]);

    return column;
}
