import React, { useCallback, useMemo } from "react";

// gql`
//     query SelectReadUpToIndex($chatId: uuid!, $attendeeId: uuid!) {
//         chat_ReadUpToIndex_by_pk(chatId: $chatId, attendeeId: $attendeeId) {
//             ...SidebarReadUpToIndex
//         }
//     }

//     mutation InsertReadUpToIndex($chatId: uuid!, $attendeeId: uuid!, $messageId: Int!) {
//         insert_chat_ReadUpToIndex_one(
//             object: { attendeeId: $attendeeId, chatId: $chatId, messageId: $messageId }
//             on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [messageId] }
//         ) {
//             attendeeId
//             chatId
//             messageId
//         }
//     }

//     mutation UpdateReadUpToIndex($chatId: uuid!, $attendeeId: uuid!, $messageId: Int!) {
//         update_chat_ReadUpToIndex_by_pk(
//             pk_columns: { attendeeId: $attendeeId, chatId: $chatId }
//             _set: { messageId: $messageId }
//         ) {
//             attendeeId
//             chatId
//             messageId
//         }
//     }
// `;

interface ReadUpToIndexCtx {
    readUpToId: number | undefined;
    setReadUpTo: (messageId: number) => void;
}

const ReadUpToIndexContext = React.createContext<ReadUpToIndexCtx | undefined>(undefined);

export function useReadUpToIndex(): ReadUpToIndexCtx {
    const ctx = React.useContext(ReadUpToIndexContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function ReadUpToIndexProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    // const unreadQ = useSelectReadUpToIndexQuery({
    //     variables: {
    //         attendeeId,
    //         chatId,
    //     },
    // });

    // const [insertUnread] = useInsertReadUpToIndexMutation();
    // const [updateUnread] = useUpdateReadUpToIndexMutation();

    const setReadUpTo = useCallback((messageId: number) => {
        // if (unreadQ.data?.chat_ReadUpToIndex_by_pk) {
        //     updateUnread({
        //         variables: {
        //             attendeeId,
        //             chatId,
        //             messageId,
        //         },
        //         optimisticResponse: {
        //             update_chat_ReadUpToIndex_by_pk: {
        //                 __typename: "chat_ReadUpToIndex",
        //                 attendeeId,
        //                 chatId,
        //                 messageId,
        //             },
        //         },
        //         update: (cache, { data: _data }) => {
        //             if (_data?.update_chat_ReadUpToIndex_by_pk) {
        //                 const data = _data.update_chat_ReadUpToIndex_by_pk;
        //                 cache.writeFragment({
        //                     data: {
        //                         ...data,
        //                         unreadCount: 0,
        //                     },
        //                     id: cache.identify(data),
        //                     fragment: SidebarReadUpToIndexFragmentDoc,
        //                     fragmentName: "SidebarReadUpToIndex",
        //                 });
        //             }
        //         },
        //     });
        // } else {
        //     insertUnread({
        //         variables: {
        //             attendeeId,
        //             chatId,
        //             messageId,
        //         },
        //         optimisticResponse: {
        //             insert_chat_ReadUpToIndex_one: {
        //                 __typename: "chat_ReadUpToIndex",
        //                 attendeeId,
        //                 chatId,
        //                 messageId,
        //             },
        //         },
        //         update: (cache, { data: _data }) => {
        //             if (_data?.insert_chat_ReadUpToIndex_one) {
        //                 const data = _data.insert_chat_ReadUpToIndex_one;
        //                 cache.writeFragment({
        //                     data: {
        //                         ...data,
        //                         unreadCount: 0,
        //                     },
        //                     id: cache.identify(data),
        //                     fragment: SidebarReadUpToIndexFragmentDoc,
        //                     fragmentName: "SidebarReadUpToIndex",
        //                 });
        //             }
        //         },
        //     });
        // }
    }, []);

    const st = useMemo(
        () => ({
            // CHAT_TODO
            readUpToId: -1, // unreadQ.data?.chat_ReadUpToIndex_by_pk?.messageId,
            setReadUpTo,
        }),
        [setReadUpTo]
    );

    return <ReadUpToIndexContext.Provider value={st}>{children}</ReadUpToIndexContext.Provider>;
}
