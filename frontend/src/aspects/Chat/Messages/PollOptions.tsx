import { Button, Flex, Input, ListItem, OrderedList, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { ChatMessageDataFragment, Chat_ReactionType_Enum } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import type { PollMessageData } from "../Types/Messages";
import { useReactions } from "./ReactionsProvider";
import { useReceiveMessageQueries } from "./ReceiveMessageQueries";

function PollOption({ value, count, onClick }: { value: string; count: number; onClick?: () => void }): JSX.Element {
    const contents = (
        <>
            <Text as="span" display="inline">
                {value}
            </Text>
            <Text as="span" display="inline" ml="auto">
                {count > 0 ? `(${count})` : ""}
            </Text>
        </>
    );
    return (
        <ListItem my={2} pos="relative" w="100%">
            {onClick ? (
                <Button
                    fontFamily="inherit"
                    fontSize="inherit"
                    fontWeight="normal"
                    pos="relative"
                    onClick={onClick}
                    zIndex={2}
                    w="100%"
                    justifyContent="flex-start"
                    minH="100%"
                    m={0}
                    py={1}
                    px={2}
                >
                    {contents}
                </Button>
            ) : (
                <Flex
                    fontFamily="inherit"
                    fontSize="inherit"
                    fontWeight="normal"
                    pos="relative"
                    onClick={onClick}
                    zIndex={2}
                    w="100%"
                    justifyContent="flex-start"
                    minH="100%"
                    m={0}
                    py={1}
                    px={2}
                >
                    {contents}
                </Flex>
            )}
        </ListItem>
    );
}

export default function PollOptions({ message }: { message: ChatMessageDataFragment }): JSX.Element {
    const config = useChatConfiguration();
    const currentAttendeeId = config.currentAttendeeId;
    const isClosed = useMemo(
        () => message.reactions.some((reaction) => reaction.type === Chat_ReactionType_Enum.PollClosed),
        [message.reactions]
    );
    const isCompleted = useMemo(
        () => message.reactions.some((reaction) => reaction.type === Chat_ReactionType_Enum.PollComplete),
        [message.reactions]
    );
    const ownVoteCount = useMemo(
        () =>
            message.reactions.filter(
                (reaction) =>
                    reaction.type === Chat_ReactionType_Enum.PollChoice && reaction.senderId === currentAttendeeId
            ).length,
        [currentAttendeeId, message.reactions]
    );

    const reactionsQ = useReactions();
    const messagesQ = useReceiveMessageQueries();

    const data = message.data as PollMessageData;
    const maxVotes = data.maxVotesPerAttendee !== 0 ? data.maxVotesPerAttendee : Number.POSITIVE_INFINITY;
    const options = useMemo(() => {
        const providedOptions = data.options ?? [];
        const userCreatedOptions = data.canAttendeesCreateOptions
            ? [
                  ...new Set(
                      message.reactions
                          .filter(
                              (x) =>
                                  x.type === Chat_ReactionType_Enum.PollChoice &&
                                  (isCompleted ||
                                      data.revealBeforeComplete ||
                                      x.senderId === currentAttendeeId ||
                                      (isClosed && message.senderId === currentAttendeeId))
                          )
                          .map((x) => x.symbol)
                  ).values(),
              ]
            : [];
        const allOptions = [...providedOptions, ...userCreatedOptions];
        if (isCompleted || data.revealBeforeComplete || (isClosed && message.senderId === currentAttendeeId)) {
            const optionsWithPopularity = new Map<string, number>(allOptions.map((x) => [x, 0]));
            message.reactions.forEach((reaction) => {
                if (reaction.type === Chat_ReactionType_Enum.PollChoice) {
                    const count = optionsWithPopularity.get(reaction.symbol) ?? 0;
                    optionsWithPopularity.set(reaction.symbol, count + 1);
                }
            });
            return optionsWithPopularity;
        } else {
            return new Map<string, number>(allOptions.map((x) => [x, 0]));
        }
    }, [
        currentAttendeeId,
        data.canAttendeesCreateOptions,
        data.options,
        data.revealBeforeComplete,
        isClosed,
        isCompleted,
        message.reactions,
        message.senderId,
    ]);

    const totalCount = useMemo(() => {
        let result = 0;
        options.forEach((v) => {
            result += v;
        });
        return result;
    }, [options]);
    const uniqueVoters = useMemo(() => {
        const voterIds = new Set(
            message.reactions.filter((x) => x.type === Chat_ReactionType_Enum.PollChoice).map((x) => x.senderId)
        );
        return voterIds.size;
    }, [message.reactions]);
    return (
        <>
            <Text as="p" fontSize="80%" fontStyle="italic">
                (
                {isCompleted
                    ? `Poll completed. ${totalCount} vote${totalCount !== 1 ? "s" : ""} cast by ${uniqueVoters} voter${
                          uniqueVoters !== 1 ? "s" : ""
                      }.`
                    : isClosed
                    ? "Poll is closed."
                    : "Poll is open."}
                )
            </Text>
            <OrderedList w="100%">
                {[...options.entries()]
                    .sort((x, y) => y[1] - x[1])
                    .map((opt) => (
                        <PollOption
                            key={opt[0]}
                            value={opt[0]}
                            count={opt[1]}
                            onClick={
                                !isClosed && ownVoteCount < maxVotes
                                    ? async () => {
                                          if (message.duplicatedMessageId) {
                                              await Promise.all([
                                                  reactionsQ.addReaction({
                                                      data: {},
                                                      messageId: message.id,
                                                      senderId: currentAttendeeId,
                                                      symbol: opt[0],
                                                      type: Chat_ReactionType_Enum.PollChoice,
                                                  }),
                                                  reactionsQ.addReaction({
                                                      data: {},
                                                      messageId: message.duplicatedMessageId,
                                                      senderId: currentAttendeeId,
                                                      symbol: opt[0],
                                                      type: Chat_ReactionType_Enum.PollChoice,
                                                  }),
                                              ]);
                                              await Promise.all([
                                                  messagesQ.refetch(message.id),
                                                  messagesQ.refetch(message.duplicatedMessageId),
                                              ]);
                                          } else {
                                              await reactionsQ.addReaction({
                                                  data: {},
                                                  messageId: message.id,
                                                  senderId: currentAttendeeId,
                                                  symbol: opt[0],
                                                  type: Chat_ReactionType_Enum.PollChoice,
                                              });
                                              await messagesQ.refetch(message.id);
                                          }
                                      }
                                    : undefined
                            }
                        />
                    ))}
                {data.canAttendeesCreateOptions && !isClosed && ownVoteCount < maxVotes ? (
                    <ListItem>
                        <Input
                            min={config.pollConfig.answerLength?.min}
                            max={config.pollConfig.answerLength?.max}
                            onKeyDown={async (ev) => {
                                if (ev.key === "Enter") {
                                    let val = (ev.target as any).value;
                                    if (val) {
                                        val = val.trim();
                                        if (
                                            val.length > (config.pollConfig.answerLength?.min ?? 0) &&
                                            val.length <
                                                (config.pollConfig.answerLength?.max ?? Number.POSITIVE_INFINITY)
                                        ) {
                                            if (message.duplicatedMessageId) {
                                                await Promise.all([
                                                    reactionsQ.addReaction({
                                                        data: {},
                                                        messageId: message.id,
                                                        senderId: currentAttendeeId,
                                                        symbol: val,
                                                        type: Chat_ReactionType_Enum.PollChoice,
                                                    }),
                                                    reactionsQ.addReaction({
                                                        data: {},
                                                        messageId: message.duplicatedMessageId,
                                                        senderId: currentAttendeeId,
                                                        symbol: val,
                                                        type: Chat_ReactionType_Enum.PollChoice,
                                                    }),
                                                ]);
                                                await Promise.all([
                                                    messagesQ.refetch(message.id),
                                                    messagesQ.refetch(message.duplicatedMessageId),
                                                ]);
                                            } else {
                                                await reactionsQ.addReaction({
                                                    data: {},
                                                    messageId: message.id,
                                                    senderId: currentAttendeeId,
                                                    symbol: val,
                                                    type: Chat_ReactionType_Enum.PollChoice,
                                                });
                                                await messagesQ.refetch(message.id);
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </ListItem>
                ) : undefined}
            </OrderedList>
        </>
    );
}
