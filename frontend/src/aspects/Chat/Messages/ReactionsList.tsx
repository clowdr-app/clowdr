import { gql } from "@apollo/client";
import { Box, BoxProps } from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
    ChatReactionDataFragment,
    Chat_ReactionType_Enum,
    useMessageReactionsSubscription,
} from "../../../generated/graphql";
import ReactionBadge from "./ReactionBadge";
import { useReactions } from "./ReactionsProvider";
import { useReceiveMessageQueries } from "./ReceiveMessageQueries";

export default function ReactionsList({
    subscribeToReactions,
    ...rest
}: {
    currentAttendeeId?: string;
    messageId: number;
    reactions: readonly ChatReactionDataFragment[];
    subscribeToReactions: boolean;
} & BoxProps): JSX.Element {
    if (subscribeToReactions) {
        return <ReactionsListSubscriptionWrapper {...rest} />;
    } else {
        return <ReactionsListInner {...rest} />;
    }
}

gql`
    fragment SubscribedChatReactionData on chat_Reaction {
        data
        id
        senderId
        symbol
        type
        messageId
    }

    subscription MessageReactions($messageId: Int!) {
        chat_Reaction(where: { messageId: { _eq: $messageId } }) {
            ...SubscribedChatReactionData
        }
    }
`;

function ReactionsListSubscriptionWrapper({
    reactions: initialReactions,
    messageId,
    ...rest
}: {
    currentAttendeeId?: string;
    messageId: number;
    reactions: readonly ChatReactionDataFragment[];
} & BoxProps): JSX.Element {
    const reactions = useMessageReactionsSubscription({
        variables: {
            messageId,
        },
    });
    return (
        <ReactionsListInner
            reactions={reactions.data?.chat_Reaction ?? initialReactions}
            messageId={messageId}
            {...rest}
        />
    );
}

function ReactionsListInner({
    reactions,
    currentAttendeeId,
    messageId,
    ...rest
}: {
    currentAttendeeId?: string;
    messageId: number;
    reactions: readonly ChatReactionDataFragment[];
} & BoxProps): JSX.Element {
    const reactionQs = useReactions();
    const messageQs = useReceiveMessageQueries();

    const reactionsGrouped: Array<[
         string,
         { count: number; attendeeSentThisReactionId: number | false }
     ]> = useMemo(() => {
        return [
            ...reactions
                .reduce((acc, reaction) => {
                    if (reaction.type === Chat_ReactionType_Enum.Emoji) {
                        const info = acc.get(reaction.symbol) ?? { count: 0, attendeeSentThisReactionId: false };
                        acc.set(reaction.symbol, {
                            count: info.count + 1,
                            attendeeSentThisReactionId:
                                info.attendeeSentThisReactionId !== false
                                    ? info.attendeeSentThisReactionId
                                    : currentAttendeeId && reaction.senderId === currentAttendeeId
                                    ? reaction.id
                                    : false,
                        });
                    }
                    return acc;
                }, new Map<string, { count: number; attendeeSentThisReactionId: number | false }>())
                .entries(),
        ];
    }, [currentAttendeeId, reactions]);

    return (
        <Box display="block" w="100%" {...rest}>
            {reactionsGrouped.map(([reaction, info]) => (
                <ReactionBadge
                    mb={2}
                    mr={2}
                    key={`reaction-${reaction}`}
                    reaction={reaction}
                    count={info.count}
                    onClick={async () => {
                        if (info.attendeeSentThisReactionId) {
                            await reactionQs.deleteReaction(info.attendeeSentThisReactionId);
                        } else {
                            await reactionQs.addReaction({
                                data: {},
                                messageId,
                                symbol: reaction,
                                type: Chat_ReactionType_Enum.Emoji,
                            });
                        }
                        messageQs.refetch(messageId);
                    }}
                />
            ))}
        </Box>
    );
}
