import type { ChatMessageDataFragment, ChatReactionDataFragment } from "../../../generated/graphql";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import type {
    AnswerMessageData,
    EventStartData,
    MessageData,
    ParticipationSurveyData,
    PollMessageData,
    PollResultsMessageData,
    ReactionData,
} from "../Types/Messages";

function areMessageDatasEqual(type: Chat_MessageType_Enum, x: MessageData, y: MessageData): boolean {
    switch (type) {
        case Chat_MessageType_Enum.Answer: {
            const xD = x as AnswerMessageData;
            const yD = y as AnswerMessageData;
            return (
                !!(
                    xD.questionMessagesIds &&
                    yD.questionMessagesIds &&
                    xD.questionMessagesIds instanceof Array &&
                    yD.questionMessagesIds instanceof Array &&
                    xD.questionMessagesIds.length === yD.questionMessagesIds.length &&
                    xD.questionMessagesIds.every((a) => yD.questionMessagesIds?.includes(a)) &&
                    yD.questionMessagesIds.every((a) => xD.questionMessagesIds?.includes(a))
                ) ||
                !!(
                    xD.questionMessagesSIds &&
                    yD.questionMessagesSIds &&
                    xD.questionMessagesSIds instanceof Array &&
                    yD.questionMessagesSIds instanceof Array &&
                    xD.questionMessagesSIds.length === yD.questionMessagesSIds.length &&
                    xD.questionMessagesSIds.every((a) => yD.questionMessagesSIds?.includes(a)) &&
                    yD.questionMessagesSIds.every((a) => xD.questionMessagesSIds?.includes(a))
                )
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
                xD.maxVotesPerRegistrant === yD.maxVotesPerRegistrant &&
                xD.revealBeforeComplete === yD.revealBeforeComplete &&
                xD.canRegistrantsCreateOptions === yD.canRegistrantsCreateOptions &&
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
        case Chat_MessageType_Enum.EventStart: {
            const xD = x as EventStartData;
            const yD = x as EventStartData;
            return xD.event.id === yD.event.id;
        }
        case Chat_MessageType_Enum.ParticipationSurvey: {
            const xD = x as ParticipationSurveyData;
            const yD = x as ParticipationSurveyData;
            return xD.event.id === yD.event.id;
        }
    }
}

function areReactionsDataEqual(_x: ReactionData, _y: ReactionData): boolean {
    // TODO: Compare poll data
    return true;
}

function areReactionsEqual(x: readonly ChatReactionDataFragment[], y: readonly ChatReactionDataFragment[]): boolean {
    if (x.length !== y.length) {
        return false;
    }

    const xS = [...x].sort((x, y) => x.sId.localeCompare(y.sId));
    const yS = [...y].sort((x, y) => x.sId.localeCompare(y.sId));
    for (let idx = 0; idx < xS.length; idx++) {
        const a = xS[idx];
        const b = yS[idx];
        if (
            a.sId !== b.sId ||
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

export function areMessagesEqual(x: ChatMessageDataFragment, y: ChatMessageDataFragment): boolean {
    // Some assumptions are baked in: senderIds, chatIds and types don't change
    return (
        x.sId === y.sId &&
        x.message === y.message &&
        areMessageDatasEqual(x.type, x.data, y.data) &&
        x.duplicatedMessageSId === y.duplicatedMessageSId &&
        areReactionsEqual(x.reactions, y.reactions)
    );
}
