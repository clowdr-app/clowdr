import { Button, Flex, Input, ListItem, OrderedList, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { ChatReactionDataFragment} from "../../../generated/graphql";
import { Chat_ReactionType_Enum } from "../../../generated/graphql";
import type { MessageState } from "../ChatGlobalState";
import { useChatConfiguration } from "../Configuration";
import type { PollMessageData } from "../Types/Messages";

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

export default function PollOptions({
    message,
    reactions,
}: {
    message: MessageState;
    reactions: readonly ChatReactionDataFragment[];
}): JSX.Element {
    const config = useChatConfiguration();
    const currentRegistrantId = config.currentRegistrantId;
    const isClosed = useMemo(() => reactions.some((reaction) => reaction.type === Chat_ReactionType_Enum.PollClosed), [
        reactions,
    ]);
    const isCompleted = useMemo(
        () => reactions.some((reaction) => reaction.type === Chat_ReactionType_Enum.PollComplete),
        [reactions]
    );
    const ownVoteCount = useMemo(
        () =>
            currentRegistrantId
                ? reactions.filter(
                      (reaction) =>
                          reaction.type === Chat_ReactionType_Enum.PollChoice &&
                          reaction.senderId === currentRegistrantId
                  ).length
                : 0,
        [currentRegistrantId, reactions]
    );

    const data = message.data as PollMessageData;
    const maxVotes = data.maxVotesPerRegistrant !== 0 ? data.maxVotesPerRegistrant : Number.POSITIVE_INFINITY;
    const options = useMemo(() => {
        const providedOptions = data.options ?? [];
        const userCreatedOptions = data.canRegistrantsCreateOptions
            ? [
                  ...new Set(
                      reactions
                          .filter(
                              (reaction) =>
                                  reaction.type === Chat_ReactionType_Enum.PollChoice &&
                                  (isCompleted ||
                                      data.revealBeforeComplete ||
                                      (currentRegistrantId &&
                                          (reaction.senderId === currentRegistrantId ||
                                              message.senderId === currentRegistrantId)))
                          )
                          .map((x) => x.symbol)
                  ).values(),
              ]
            : [];
        const allOptions = [...providedOptions, ...userCreatedOptions];
        if (
            isCompleted ||
            data.revealBeforeComplete ||
            (currentRegistrantId && message.senderId === currentRegistrantId)
        ) {
            const optionsWithPopularity = new Map<string, number>(allOptions.map((x) => [x, 0]));
            reactions.forEach((reaction) => {
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
        currentRegistrantId,
        data.canRegistrantsCreateOptions,
        data.options,
        data.revealBeforeComplete,
        isCompleted,
        reactions,
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
            reactions.filter((x) => x.type === Chat_ReactionType_Enum.PollChoice).map((x) => x.senderId)
        );
        return voterIds.size;
    }, [reactions]);
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
                                currentRegistrantId && !isClosed && ownVoteCount < maxVotes
                                    ? async () => {
                                          await message.addReaction({
                                              data: {},
                                              symbol: opt[0],
                                              type: Chat_ReactionType_Enum.PollChoice,
                                          });
                                      }
                                    : undefined
                            }
                        />
                    ))}
                {data.canRegistrantsCreateOptions && !isClosed && ownVoteCount < maxVotes ? (
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
                                            await message.addReaction({
                                                data: {},
                                                symbol: val,
                                                type: Chat_ReactionType_Enum.PollChoice,
                                            });
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
