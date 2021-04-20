import { Box, BoxProps } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { ChatReactionDataFragment, Chat_ReactionType_Enum } from "../../../generated/graphql";
import type { MessageState } from "../ChatGlobalState";
import ReactionBadge from "./ReactionBadge";

export default function ReactionsList({
    subscribeToReactions,
    ...rest
}: {
    currentAttendeeId?: string;
    message: MessageState;
    reactions: readonly ChatReactionDataFragment[];
    subscribeToReactions: boolean;
} & BoxProps): JSX.Element {
    if (subscribeToReactions) {
        return <ReactionsListSubscriptionWrapper {...rest} />;
    } else {
        return <ReactionsListInner {...rest} />;
    }
}

function ReactionsListSubscriptionWrapper({
    reactions,
    message,
    ...rest
}: {
    currentAttendeeId?: string;
    message: MessageState;
    reactions: readonly ChatReactionDataFragment[];
} & BoxProps): JSX.Element {
    // useEffect(() => {
    //     message.startReactionsSubscription();

    //     return () => {
    //         message.endReactionsSubscription();
    //     };
    // }, [message]);
    return <ReactionsListInner reactions={reactions} message={message} {...rest} />;
}

function ReactionsListInner({
    reactions,
    currentAttendeeId,
    message,
    ...rest
}: {
    currentAttendeeId?: string;
    message: MessageState;
    reactions: readonly ChatReactionDataFragment[];
} & BoxProps): JSX.Element {
    const reactionsGrouped: Array<
        [string, { senderIds: string[]; attendeeSentThisReactionSId: string | false }]
    > = useMemo(() => {
        return R.sortWith(
            [(x, y) => y[1].senderIds.length - x[1].senderIds.length, (x, y) => x[0].localeCompare(y[0])],
            [
                ...reactions
                    .reduce((acc, reaction) => {
                        if (reaction.type === Chat_ReactionType_Enum.Emoji) {
                            const info = acc.get(reaction.symbol) ?? {
                                senderIds: [],
                                attendeeSentThisReactionSId: false,
                            };
                            acc.set(reaction.symbol, {
                                senderIds: [...info.senderIds, reaction.senderId],
                                attendeeSentThisReactionSId:
                                    info.attendeeSentThisReactionSId !== false
                                        ? info.attendeeSentThisReactionSId
                                        : currentAttendeeId && reaction.senderId === currentAttendeeId
                                        ? reaction.sId
                                        : false,
                            });
                        }
                        return acc;
                    }, new Map<string, { senderIds: string[]; attendeeSentThisReactionSId: string | false }>())
                    .entries(),
            ]
        );
    }, [currentAttendeeId, reactions]);

    return (
        <Box display="block" w="100%" {...rest}>
            {reactionsGrouped.map(([reaction, info]) => (
                <ReactionBadge
                    mb={2}
                    mr={2}
                    key={`reaction-${reaction}`}
                    reaction={reaction}
                    senderIds={info.senderIds}
                    currentAttendeeId={currentAttendeeId}
                    onClick={async () => {
                        if (info.attendeeSentThisReactionSId) {
                            await message.deleteReaction(info.attendeeSentThisReactionSId);
                        } else {
                            await message.addReaction({
                                data: {},
                                symbol: reaction,
                                type: Chat_ReactionType_Enum.Emoji,
                            });
                        }
                    }}
                />
            ))}
        </Box>
    );
}
