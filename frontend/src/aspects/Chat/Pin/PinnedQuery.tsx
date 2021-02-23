import { ApolloError, gql } from "@apollo/client";
import React, { createContext, useEffect, useMemo } from "react";
import { usePinChatMutation, useSelectPinQuery, useUnpinChatMutation } from "../../../generated/graphql";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useChatConfiguration } from "../Configuration";
import type { MutableQuery } from "../Types/Queries";

export interface PinnedQuery
    extends MutableQuery<
        {
            isPinned: boolean;
            allowedToUnpin: boolean;
        },
        boolean
    > {}

const QueryContext = createContext<PinnedQuery | undefined>(undefined);

gql`
    fragment PinData on chat_Pin {
        chatId
        attendeeId
        wasManuallyPinned
    }

    fragment ChatPinConfig on chat_Chat {
        id
        enableAutoPin
        enableMandatoryPin
    }

    query SelectPin($chatId: uuid!, $attendeeId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            ...ChatPinConfig
        }
        chat_Pin(where: { chatId: { _eq: $chatId }, attendeeId: { _eq: $attendeeId } }) {
            ...PinData
        }
    }

    mutation PinChat($chatId: uuid!, $attendeeId: uuid!) {
        insert_chat_Pin(
            objects: { chatId: $chatId, attendeeId: $attendeeId }
            on_conflict: { constraint: ChatPin_pkey, update_columns: wasManuallyPinned }
        ) {
            returning {
                ...PinData
            }
        }
    }

    mutation UnpinChat($chatId: uuid!, $attendeeId: uuid!) {
        delete_chat_Pin_by_pk(chatId: $chatId, attendeeId: $attendeeId) {
            ...PinData
        }
    }
`;

export function ChatPinnedQueryProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const config = useChatConfiguration();
    const pinQ = useSelectPinQuery({
        variables: {
            attendeeId: config.currentAttendeeId,
            chatId: config.state.Id,
        },
    });

    useEffect(() => {
        if (pinQ.variables?.chatId !== config.state.Id) {
            pinQ.refetch({
                attendeeId: config.currentAttendeeId,
                chatId: config.state.Id,
            });
        }
    }, [config.currentAttendeeId, pinQ, config.state.Id]);

    const [pinChat, { loading: pinChatLoading }] = usePinChatMutation({
        variables: {
            attendeeId: config.currentAttendeeId,
            chatId: config.state.Id,
        },
    });
    const [unpinChat, { loading: unpinChatLoading, error: unpinChatError }] = useUnpinChatMutation({
        variables: {
            attendeeId: config.currentAttendeeId,
            chatId: config.state.Id,
        },
    });

    const data = useMemo(
        () => ({
            isPinned: !!pinQ.data && pinQ.data?.chat_Pin.length > 0,
            allowedToUnpin: !!pinQ.data?.chat_Chat_by_pk && !pinQ.data.chat_Chat_by_pk.enableMandatoryPin,
        }),
        [pinQ.data]
    );

    useQueryErrorToast(pinQ.error ?? unpinChatError, false, "PinnedQuery.tsx");

    const value: PinnedQuery = useMemo(
        () => ({
            data,
            error: pinQ.error,
            loading: pinQ.loading || pinChatLoading || unpinChatLoading,
            refetch: async () => {
                const newD = await pinQ.refetch();
                return {
                    isPinned: newD.data.chat_Pin.length > 0,
                    allowedToUnpin: !!newD.data?.chat_Chat_by_pk && !newD.data.chat_Chat_by_pk.enableMandatoryPin,
                };
            },
            mutate: async (v) => {
                if (data.allowedToUnpin) {
                    if (v) {
                        try {
                            await pinChat();
                            await pinQ.refetch();
                        } catch (e) {
                            if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                                throw e;
                            }
                        }
                    } else {
                        try {
                            await unpinChat();
                            await pinQ.refetch();
                        } catch (e) {
                            alert(e);
                        }
                    }
                }
            },
        }),
        [data, pinChat, pinChatLoading, pinQ, unpinChat, unpinChatLoading]
    );

    return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useChatPinnedQuery(): PinnedQuery {
    const ctx = React.useContext(QueryContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
