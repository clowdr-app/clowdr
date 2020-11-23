import { gql } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import { useSelectChatsQuery } from "../../generated/graphql";
import useQueryErrorToast from "../useQueryErrorToast";
import { ChatsContext, defaultChatsContext } from "./useChats";

const _chatsQueries = gql`
    query selectChats {
        Chat {
            id
            name
            description
            mode
            members {
                userId
            }
            viewers {
                id
                lastSeen
                userId
            }
        }
    }
`;

export default function ManageChats({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return (
            <ManagerChats_IsAuthenticated>
                {children}
            </ManagerChats_IsAuthenticated>
        );
    } else {
        return (
            <ChatsContext.Provider value={defaultChatsContext}>
                {children}
            </ChatsContext.Provider>
        );
    }
}

function ManagerChats_IsAuthenticated({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}) {
    const { loading, error, data, refetch } = useSelectChatsQuery();

    useQueryErrorToast(error);

    useEffect(() => {
        const intervalId = setInterval(() => {
            refetch();
        }, 1000 * 60);
        return () => {
            clearInterval(intervalId);
        };
    }, [refetch]);

    const value = loading ? null : error ? false : data ?? null;

    return (
        <ChatsContext.Provider
            value={{
                chats: value,
                refetchChats: refetch,
            }}
        >
            {children}
        </ChatsContext.Provider>
    );
}
