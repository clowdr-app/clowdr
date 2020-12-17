import { gql } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { useSelectChatsQuery } from "../../../generated/graphql";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
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

export default function ChatsProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return <ChatsProvider_IsAuthenticated>{children}</ChatsProvider_IsAuthenticated>;
    } else {
        return <ChatsContext.Provider value={defaultChatsContext}>{children}</ChatsContext.Provider>;
    }
}

function ChatsProvider_IsAuthenticated({ children }: { children: string | JSX.Element | Array<JSX.Element> }) {
    const { loading, error, data, refetch } = useSelectChatsQuery({
        pollInterval: 1000 * 120,
    });
    useQueryErrorToast(error);

    // TODO: Live-subscribe to new chats

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
