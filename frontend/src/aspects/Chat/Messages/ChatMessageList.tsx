import { Box, BoxProps } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { ChatMessageDataFragment, ChatReactionDataFragment, Chat_MessageType_Enum } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import type {
    AnswerMessageData,
    MessageData,
    PollMessageData,
    PollResultsMessageData,
    ReactionData,
} from "../Types/Messages";
import LazyLoadingScroller from "./LazyLoadingScroller";
import MessageBox from "./MessageBox";
import { useReceiveMessageQueries } from "./ReceiveMessageQueries";

interface ChatMessageListProps {
    chatId: string;
}

function areMessageDatasEqual(type: Chat_MessageType_Enum, x: MessageData, y: MessageData): boolean {
    switch (type) {
        case Chat_MessageType_Enum.Answer: {
            const xD = x as AnswerMessageData;
            const yD = y as AnswerMessageData;
            return (
                xD.questionMessagesIds &&
                yD.questionMessagesIds &&
                xD.questionMessagesIds instanceof Array &&
                yD.questionMessagesIds instanceof Array &&
                xD.questionMessagesIds.length === yD.questionMessagesIds.length &&
                xD.questionMessagesIds.every((a) => yD.questionMessagesIds.includes(a)) &&
                yD.questionMessagesIds.every((a) => xD.questionMessagesIds.includes(a))
            );
        }
        case Chat_MessageType_Enum.DuplicationMarker:
            return true;
        case Chat_MessageType_Enum.Emote:
            return true;
        case Chat_MessageType_Enum.Message:
            return true;
        case Chat_MessageType_Enum.Poll: {
            const xD = x as PollMessageData;
            const yD = y as PollMessageData;
            return (
                xD.maxVotesPerAttendee === yD.maxVotesPerAttendee &&
                xD.revealBeforeComplete === yD.revealBeforeComplete &&
                xD.canAttendeesCreateOptions === yD.canAttendeesCreateOptions &&
                xD.options instanceof Array &&
                yD.options instanceof Array &&
                xD.options.length === yD.options.length &&
                xD.options.every((optX) => yD.options.some((optY) => optX === optY)) &&
                yD.options.every((optX) => xD.options.some((optY) => optX === optY))
            );
        }
        case Chat_MessageType_Enum.PollResults: {
            const xD = x as PollResultsMessageData;
            const yD = y as PollResultsMessageData;
            return xD.pollMessageId === yD.pollMessageId;
        }
        case Chat_MessageType_Enum.Question:
            return true;
    }
}

function areReactionsDataEqual(x: ReactionData, y: ReactionData): boolean {
    // TODO: Compare poll data
    return true;
}

function areReactionsEqual(x: readonly ChatReactionDataFragment[], y: readonly ChatReactionDataFragment[]): boolean {
    if (x.length !== y.length) {
        return false;
    }

    const xS = [...x].sort((x, y) => x.id - y.id);
    const yS = [...y].sort((x, y) => x.id - y.id);
    for (let idx = 0; idx < xS.length; idx++) {
        const a = xS[idx];
        const b = yS[idx];
        if (
            a.id !== b.id ||
            a.symbol !== b.symbol ||
            a.type !== b.type ||
            a.senderId !== b.senderId ||
            !areReactionsDataEqual(a.data, b.data)
        ) {
            return false;
        }
    }
    return true;
}

function areMessagesEqual(x: ChatMessageDataFragment, y: ChatMessageDataFragment): boolean {
    // Some assumptions are baked in: senderIds, chatIds and types don't change
    return (
        x.id === y.id &&
        x.message === y.message &&
        areMessageDatasEqual(x.type, x.data, y.data) &&
        x.duplicatedMessageId === y.duplicatedMessageId &&
        x.isPinned === y.isPinned &&
        areReactionsEqual(x.reactions, y.reactions)
    );
}

export function ChatMessageList({ chatId: _chatId, ...rest }: ChatMessageListProps & BoxProps): JSX.Element {
    const config = useChatConfiguration();
    const messages = useReceiveMessageQueries();

    const renderItem = useCallback(
        // Don't apply style changes etc here - they won't get propagated reliably
        (item: ChatMessageDataFragment) => <MessageBox key={"message-" + item.id} message={item} />,
        []
    );

    return (
        <Box {...rest}>
            <LazyLoadingScroller<ChatMessageDataFragment>
                fixedBatchSize={config.messageBatchSize ?? 30}
                load={messages.load}
                isEqual={areMessagesEqual}
                renderItem={renderItem}
                monitoredItems={messages.liveMessages}
                deletedItems={messages.deletedItems}
            />
        </Box>
    );
}
