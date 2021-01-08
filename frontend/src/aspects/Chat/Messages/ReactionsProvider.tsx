import { ApolloError, gql } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import React from "react";
import {
    Chat_Reaction_Insert_Input,
    useAddReactionMutation,
    useDeleteReactionMutation,
} from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";

gql`
    mutation AddReaction($reaction: chat_Reaction_insert_input!) {
        insert_chat_Reaction(objects: [$reaction]) {
            affected_rows
        }
    }

    mutation DeleteReaction($reactionId: Int!) {
        delete_chat_Reaction_by_pk(id: $reactionId) {
            id
        }
    }
`;

interface ReactionsCtx {
    addReaction: (reaction: Chat_Reaction_Insert_Input) => Promise<void>;
    deleteReaction: (reactionId: number) => Promise<void>;
}

const ReactionsContext = React.createContext<ReactionsCtx | undefined>(undefined);

export function useReactions(): ReactionsCtx {
    const ctx = React.useContext(ReactionsContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function ReactionsProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const toast = useToast();
    const config = useChatConfiguration();

    const [addReaction] = useAddReactionMutation();
    const [deleteReaction] = useDeleteReactionMutation();

    return (
        <ReactionsContext.Provider
            value={{
                addReaction: async (reaction) => {
                    try {
                        await addReaction({
                            variables: {
                                reaction: {
                                    ...reaction,
                                    senderId: config.currentAttendeeId,
                                },
                            },
                        });
                    } catch (e) {
                        if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                            toast({
                                description: e.message ?? e.toString(),
                                isClosable: true,
                                position: "bottom-right",
                                status: "error",
                                title: "Failed to add reaction",
                            });
                        }
                    }
                },
                deleteReaction: async (reactionId) => {
                    try {
                        await deleteReaction({
                            variables: {
                                reactionId,
                            },
                        });
                    } catch (e) {
                        toast({
                            description: e.message ?? e.toString(),
                            isClosable: true,
                            position: "bottom-right",
                            status: "error",
                            title: "Failed to delete reaction",
                        });
                    }
                },
            }}
        >
            {children}
        </ReactionsContext.Provider>
    );
}
