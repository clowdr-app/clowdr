import type { UseRadioProps } from "@chakra-ui/react";
import {
    Box,
    Button,
    chakra,
    Divider,
    Flex,
    HStack,
    Image,
    Text,
    Textarea,
    useColorModeValue,
    useRadio,
    useRadioGroup,
    VStack,
} from "@chakra-ui/react";
import { datadogLogs } from "@datadog/browser-logs";
import React, { useEffect, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import ReactPlayer from "react-player";
import type { ChatReactionDataFragment, RegistrantDataFragment } from "../../../generated/graphql";
import { Chat_MessageType_Enum, Chat_ReactionType_Enum } from "../../../generated/graphql";
import ProfileBadge from "../../Badges/ProfileBadge";
import FAIcon from "../../Chakra/FAIcon";
import { DownloadButton } from "../../Chakra/LinkButton";
import { Markdown } from "../../Chakra/Markdown";
import { useRegistrant } from "../../Conference/RegistrantsContext";
import useCurrentRegistrant from "../../Conference/useCurrentRegistrant";
import { useAddEmojiFloat, useEmojiFloat } from "../../Emoji/EmojiFloat";
import type { Observable } from "../../Observable";
import { roundUpToNearest } from "../../Utils/MathUtils";
import type { MessageState } from "../ChatGlobalState";
import { MessageTypeIndicator } from "../Compose/MessageTypeIndicator";
import { ChatSpacing, useChatConfiguration } from "../Configuration";
import type { BaseMessageData, EventStartData, ParticipationReactionData } from "../Types/Messages";
import { MediaType } from "../Types/Messages";
import MessageControls from "./MessageControls";
import PollOptions from "./PollOptions";
import ProfileBox from "./ProfileBox";
import ReactionsList from "./ReactionsList";
import { useMaybeReceiveMessageQueries } from "./ReceiveMessageQueries";

// function ReflectionButton({ children }: { children: React.ReactNode | React.ReactNodeArray }): JSX.Element {
//     const infoModal = useReflectionInfoModal();
//     return (
//         <Button
//             spacing={0}
//             alignItems="stretch"
//             fontSize="inherit"
//             p={0}
//             m={0}
//             h="auto"
//             minH="unset"
//             minW="unset"
//             opacity={0.7}
//             _hover={{
//                 opacity: 1,
//             }}
//             _focus={{
//                 opacity: 1,
//                 boxShadow: defaultOutline_AsBoxShadow,
//             }}
//             _active={{
//                 opacity: 1,
//                 boxShadow: defaultOutline_AsBoxShadow,
//             }}
//             onClick={infoModal}
//         >
//             <Tag colorScheme="yellow" variant="solid" borderRightRadius={0} fontSize="inherit">
//                 {children}
//             </Tag>
//             <Tag
//                 aria-label="Find out about chat reflection"
//                 color="white"
//                 backgroundColor="pink.700"
//                 borderLeftRadius={0}
//                 fontSize="inherit"
//                 py={2}
//             >
//                 <FAIcon iconStyle="s" icon="info-circle" />
//             </Tag>
//         </Button>
//     );
// }

function MessageBody({
    message,
    registrant,
    subscribeToReactions,
}: {
    message: MessageState;
    registrant: RegistrantDataFragment | null;
    subscribeToReactions: boolean;
}): JSX.Element {
    const config = useChatConfiguration();
    const messages = useMaybeReceiveMessageQueries();
    const [reactions, setReactions] = useState<ChatReactionDataFragment[]>([]);
    useEffect(() => {
        return message.Reactions.subscribe(setReactions);
    }, [message.Reactions]);

    const [_updatedAt, setUpdatedAt] = useState<number>(-1);
    useEffect(() => {
        const unsub = message.updatedAtObs.subscribe((v) => {
            setUpdatedAt(v);
        });
        return () => {
            unsub();
        };
    }, [message.updatedAtObs]);

    const scaleFactor = config.spacing / ChatSpacing.RELAXED;

    const pictureSizeMinPx = 35;
    const pictureSizeMaxPx = 50;
    const pictureSizeRange = pictureSizeMaxPx - pictureSizeMinPx;
    const pictureSize = Math.round(pictureSizeMinPx + pictureSizeRange * scaleFactor);

    const createdAt = useMemo(() => new Date(message.created_at), [message.created_at]);
    const timeColour = useColorModeValue("ChatMessage.timeColor-light", "ChatMessage.timeColor-dark");
    const nameColour = useColorModeValue("ChatMessage.nameColor-light", "ChatMessage.nameColor-dark");
    const timeFormat: Intl.DateTimeFormatOptions = useMemo(
        () => ({
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }),
        []
    );
    const smallFontSize = Math.max(config.fontSizeRange.value * 0.7, 10);

    const profileEl = useMemo(
        () => (
            <VStack
                alignItems="center"
                spacing={roundUpToNearest(config.spacing * 0.5, 1) + "px"}
                p={0}
                m={0}
                minW={pictureSize}
            >
                <Text as="div" fontSize={smallFontSize} color={timeColour} w="100%" textAlign="left" lineHeight="2.7ex">
                    {createdAt.toLocaleString(undefined, timeFormat)}
                </Text>
                {message.type !== Chat_MessageType_Enum.Message && message.type !== Chat_MessageType_Enum.Emote ? (
                    <MessageTypeIndicator messageType={message.type} fontSize={pictureSize * 0.8} opacity={0.7} />
                ) : message.senderId ? (
                    <ProfileBox
                        registrant={registrant}
                        w={pictureSize}
                        showPlaceholderProfilePictures={config.messageConfig.showPlaceholderProfilePictures}
                        showProfilePictures={config.messageConfig.showProfilePictures}
                    />
                ) : undefined}
            </VStack>
        ),
        [
            registrant,
            config.spacing,
            config.messageConfig,
            createdAt,
            message.senderId,
            message.type,
            pictureSize,
            smallFontSize,
            timeColour,
            timeFormat,
        ]
    );

    const registrantNameEl = useMemo(
        () => (
            <HStack
                marginTop={
                    config.spacing === ChatSpacing.RELAXED
                        ? "-1.5ex"
                        : config.spacing === ChatSpacing.COMFORTABLE
                        ? "-0.5ex"
                        : undefined
                }
            >
                <Text as="span" fontSize={smallFontSize} color={nameColour}>
                    {registrant?.displayName ?? " "}
                </Text>
                {registrant?.profile?.badges && registrant.profile.badges.length > 0 ? (
                    <ProfileBadge badge={registrant.profile.badges[0]} fontSize="0.8em" lineHeight="1.2em" py={0} />
                ) : undefined}
            </HStack>
        ),
        [registrant?.displayName, registrant?.profile?.badges, config.spacing, smallFontSize, nameColour]
    );

    const controls = useMemo(
        () => (
            <Flex flexDir="row" w="100%">
                {registrantNameEl}
                {/* TODO: Permissions */}
                <MessageControls
                    hideReactions={message.type === Chat_MessageType_Enum.Emote}
                    fontSize={smallFontSize}
                    ml="auto"
                    isOwnMessage={!!config.currentRegistrantId && message.senderId === config.currentRegistrantId}
                    message={message}
                    usedReactions={reactions.reduce((acc, reaction) => {
                        if (
                            config.currentRegistrantId &&
                            reaction.type === Chat_ReactionType_Enum.Emoji &&
                            reaction.senderId === config.currentRegistrantId
                        ) {
                            return [...acc, reaction.symbol];
                        }
                        return acc;
                    }, [] as string[])}
                    isPollOpen={
                        message.type === Chat_MessageType_Enum.Poll
                            ? !reactions.some((reaction) => reaction.type === Chat_ReactionType_Enum.PollClosed)
                            : undefined
                    }
                    isPollIncomplete={
                        message.type === Chat_MessageType_Enum.Poll
                            ? !reactions.some((reaction) => reaction.type === Chat_ReactionType_Enum.PollComplete)
                            : undefined
                    }
                />
            </Flex>
        ),
        [config.currentRegistrantId, message, reactions, registrantNameEl, smallFontSize]
    );

    const messageContents = useMemo(
        () =>
            message.type === Chat_MessageType_Enum.Emote ? (
                <HStack fontSize={pictureSize} w="100%" pt={config.spacing}>
                    <Twemoji className="twemoji" text={message.message} />
                </HStack>
            ) : message.type === Chat_MessageType_Enum.ParticipationSurvey ? (
                <ParticipationSurvey message={message} />
            ) : (
                <Markdown restrictHeadingSize autoLinkify>
                    {message.message}
                </Markdown>
            ),
        [config.spacing, message, pictureSize]
    );

    const reactionEls = useMemo(
        () => (
            <ReactionsList
                reactions={reactions}
                currentRegistrantId={config.currentRegistrantId}
                message={message}
                fontSize={config.fontSizeRange.value}
                subscribeToReactions={subscribeToReactions}
            />
        ),
        [config.currentRegistrantId, config.fontSizeRange.value, message, reactions, subscribeToReactions]
    );

    const question = useMemo(
        () =>
            messages ? (
                message.type === Chat_MessageType_Enum.Question ? (
                    reactions.some((x) => x.type === Chat_ReactionType_Enum.Answer) ? (
                        <Button
                            fontSize={smallFontSize}
                            p={config.spacing}
                            m={config.spacing}
                            colorScheme="ChatMessageAnswerAgainButton"
                            w="auto"
                            h="auto"
                            onClick={() => {
                                if (message.duplicatedMessageSId) {
                                    messages.setAnsweringQuestionSId.current?.f([
                                        message.sId,
                                        message.duplicatedMessageSId,
                                    ]);
                                } else {
                                    messages.setAnsweringQuestionSId.current?.f([message.sId]);
                                }
                            }}
                        >
                            Answered! (Answer again?)
                        </Button>
                    ) : (
                        <Button
                            fontSize={smallFontSize}
                            p={config.spacing}
                            m={config.spacing}
                            colorScheme="ChatMessageAnswerButton"
                            w="auto"
                            h="auto"
                            onClick={() => {
                                if (message.duplicatedMessageSId) {
                                    messages.setAnsweringQuestionSId.current?.f([
                                        message.sId,
                                        message.duplicatedMessageSId,
                                    ]);
                                } else {
                                    messages.setAnsweringQuestionSId.current?.f([message.sId]);
                                }
                            }}
                        >
                            Answer this question
                        </Button>
                    )
                ) : undefined
            ) : undefined,
        [config.spacing, message.duplicatedMessageSId, message.sId, reactions, message.type, messages, smallFontSize]
    );

    const poll = useMemo(
        () =>
            message.type === Chat_MessageType_Enum.Poll ? (
                <PollOptions message={message} reactions={reactions} />
            ) : undefined,
        [message, reactions]
    );

    const messageData = message.data as BaseMessageData;
    const msgBody = useMemo(() => {
        const urlParts = messageData.media?.url.split("/");
        return (
            <VStack
                alignItems="flex-start"
                spacing={roundUpToNearest(config.spacing * 0.5, 1) + "px"}
                p={0}
                pr={config.spacing}
                m={0}
                w="100%"
                h={message.type === Chat_MessageType_Enum.Emote ? "100%" : "auto"}
            >
                {controls}
                {messageContents}
                {reactionEls}
                {question}
                {poll}
                {messageData.media ? (
                    <>
                        {messageData.media.type === MediaType.Audio || messageData.media.type === MediaType.Video ? (
                            <ReactPlayer url={messageData.media.url} controls width="100%" height="auto" />
                        ) : messageData.media.type === MediaType.Image ? (
                            <Image src={messageData.media.url} alt={messageData.media.alt} />
                        ) : undefined}
                        <DownloadButton
                            to={messageData.media.url}
                            size="xs"
                            colorScheme="SecondaryActionButton"
                            fileName={
                                messageData.media.name ?? (urlParts ? urlParts[urlParts.length - 1] : "unknown-file")
                            }
                            variant="ghost"
                        >
                            <FAIcon iconStyle="s" icon="paperclip" />
                            &nbsp; {messageData.media.name ?? "Attachment"}
                        </DownloadButton>
                    </>
                ) : undefined}
            </VStack>
        );
    }, [config.spacing, controls, messageContents, message.type, poll, question, reactionEls, messageData]);

    if (message.type === Chat_MessageType_Enum.DuplicationMarker) {
        return <></>;
        // const data = message.data as DuplicationMarkerMessageData;
        // return (
        //     <Flex
        //         w="100%"
        //         spacing={0}
        //         fontSize={smallFontSize * 1.1}
        //         flexDir={data.type === "start" ? "column" : "column-reverse"}
        //         alignItems="center"
        //     >
        //         <Divider my={config.spacing} borderColor="yellow.400" w="100%" height="1px" />
        //         {data.type === "start" ? (
        //             <ReflectionButton>Reflection started</ReflectionButton>
        //         ) : (
        //             <ReflectionButton>Reflection ended</ReflectionButton>
        //         )}
        //         <HStack alignItems="stretch" justifyContent="center" py={0} px={1} my={2} opacity={0.8}>
        //             <LinkButton
        //                 flex="0 0 min-content"
        //                 backgroundColor="gray.700"
        //                 p={0}
        //                 m={0}
        //                 minH={0}
        //                 h="100%"
        //                 borderRadius={5}
        //                 fontFamily="monospace"
        //                 noOfLines={1}
        //                 to={`${conferencePath}/room/${data.room.id}`}
        //                 fontSize="inherit"
        //                 linkProps={{
        //                     p: 0,
        //                     m: 0,
        //                 }}
        //                 color="white"
        //             >
        //                 <chakra.span mx={2}>{data.room.name}</chakra.span>
        //             </LinkButton>
        //             <Box>
        //                 <FAIcon iconStyle="s" icon="arrows-alt-h" aria-label="reflected with" />
        //             </Box>
        //             <LinkButton
        //                 p={0}
        //                 m={0}
        //                 minH={0}
        //                 h="100%"
        //                 to={`${conferencePath}/item/${data.item.id}`}
        //                 fontSize="inherit"
        //                 linkProps={{
        //                     p: 0,
        //                     m: 0,
        //                 }}
        //                 flex="0 1 auto"
        //                 backgroundColor="gray.700"
        //                 borderRadius={5}
        //                 fontFamily="monospace"
        //                 noOfLines={1}
        //                 color="white"
        //             >
        //                 <chakra.span mx={2}>{data.item.title}</chakra.span>
        //             </LinkButton>
        //         </HStack>
        //         {data.type === "start" ? (
        //             <FAIcon iconStyle="s" icon="angle-double-down" color="yellow.400" aria-hidden />
        //         ) : (
        //             <FAIcon iconStyle="s" icon="angle-double-up" color="yellow.400" aria-hidden />
        //         )}
        //     </Flex>
        // );
    }

    if (message.type === Chat_MessageType_Enum.EventStart) {
        const data = message.data as EventStartData;
        return (
            <Flex w="100%" fontSize={smallFontSize * 1.1} flexDir={"column"} alignItems="center">
                <Divider my={config.spacing} borderColor="yellow.400" borderBottomWidth="2px" w="100%" height="2px" />
                <Text fontWeight="bold">
                    Started at{" "}
                    {new Date(message.created_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>
                <Text whiteSpace="normal" overflowWrap="break-word" maxW="100%">
                    {data.item ? data.item.title : data.event.name}
                </Text>
            </Flex>
        );
    }

    return (
        <>
            {profileEl}
            {msgBody}
        </>
    );
}

export default function MessageBox({
    message,
    positionObservable,
}: {
    message: MessageState;
    positionObservable?: Observable<number>;
}): JSX.Element {
    const config = useChatConfiguration();
    const scaleFactor = config.spacing / ChatSpacing.RELAXED;

    const lineHeightMin = 2.3;
    const lineHeightMax = 4;
    const lineHeightRange = lineHeightMax - lineHeightMin;
    const lineHeight = lineHeightMin + lineHeightRange * scaleFactor;

    const isQuestion = message.type === Chat_MessageType_Enum.Question;
    const isAnswer = message.type === Chat_MessageType_Enum.Answer;
    const bgColour = useColorModeValue(
        isQuestion
            ? "ChatMessage.questionBgColor-light"
            : isAnswer
            ? "ChatMessage.answerBgColor-light"
            : "ChatMessage.messageBgColor-light",
        isQuestion
            ? "ChatMessage.questionBgColor-dark"
            : isAnswer
            ? "ChatMessage.answerBgColor-dark"
            : "ChatMessage.messageBgColor-dark"
    );

    const createdAt = useMemo(() => new Date(message.created_at), [message.created_at]);

    const timeFormat: Intl.DateTimeFormatOptions = useMemo(
        () => ({
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }),
        []
    );

    const senderIdObj = useMemo(
        () => (message.senderId ? { registrant: message.senderId } : undefined),
        [message.senderId]
    );
    const registrant = useRegistrant(senderIdObj);

    const emojiFloat = useEmojiFloat();
    const addEmojiFloat = useAddEmojiFloat();
    const isEmoteNow = emojiFloat.isActive === message.chatId && message.type === Chat_MessageType_Enum.Emote;
    // useState
    // && message.created_at >= Date.now() - 10000
    useEffect(() => {
        if (
            emojiFloat.isActive === message.chatId &&
            message.type === Chat_MessageType_Enum.Emote &&
            message.created_at >= Date.now() - 10000 &&
            registrant
        ) {
            addEmojiFloat.addFloater(message.message, registrant.displayName);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registrant?.displayName]);

    const [subscribeToReactions, setSubscribeToReactions] = useState<boolean>(false);
    useEffect(() => {
        return positionObservable?.subscribe((v) => {
            setSubscribeToReactions(v < 10);
        });
    }, [positionObservable]);

    return message.type === Chat_MessageType_Enum.DuplicationMarker ? (
        <></>
    ) : isEmoteNow ? (
        <></>
    ) : (
        <HStack
            role="listitem"
            mr="1px"
            borderRadius={5}
            px="4px"
            pt="1px"
            pb="4px"
            bgColor={isQuestion || isAnswer ? bgColour : undefined}
            mt={config.spacing}
            id={`message-${message.sId}`}
            alignItems="flex-start"
            lineHeight={lineHeight + "ex"}
            _hover={{}}
            tabIndex={0}
            aria-label={`Message sent at ${createdAt.toLocaleString(undefined, timeFormat)} by ${
                registrant?.displayName ?? "<Loading name>"
            }. ${message.message}`}
        >
            <MessageBody subscribeToReactions={subscribeToReactions} registrant={registrant} message={message} />
        </HStack>
    );
}

function ParticipationSurvey({ message }: { message: MessageState }): JSX.Element {
    // TODO: Time cutoff for responses
    const registrant = useCurrentRegistrant();
    const [selectedRating, setSelectedRating] = useState<string>("");
    const [comment, setComment] = useState<string>("");
    const [submitted, setSubmitted] = useState<ParticipationReactionData | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        return message.Reactions.subscribe((reactions) => {
            setSubmitted((old) => old ?? reactions.find((x) => x.senderId === registrant.id)?.data ?? null);
        });
    }, [message.Reactions, registrant.id]);

    const allowSubmit = useMemo(() => Date.now() - message.created_at < 5 * 60 * 1000, [message.created_at]);

    return (
        <VStack spacing={3} w="100%" alignItems="flex-start">
            {!submitted ? (
                allowSubmit ? (
                    <>
                        <Text>This event has ended. Would you like to log your participation or leave feedback?</Text>
                        <Box w="100%">
                            <Text>How did you feel about this event? (optional)</Text>
                            <FeedbackOptions
                                options={[
                                    { label: "😍", value: "5" },
                                    { label: "🙂", value: "4" },
                                    { label: "😐", value: "3" },
                                    { label: "😕", value: "2" },
                                    { label: "☹", value: "1" },
                                    { label: "-", value: "" },
                                ]}
                                value={selectedRating}
                                onChange={setSelectedRating}
                                name={message.data.event.id + "-feedback-rating"}
                            />
                        </Box>
                        <Box w="100%">
                            <Text>Leave a comment (optional)</Text>
                            <Textarea value={comment} onChange={(ev) => setComment(ev.target.value)} />
                        </Box>
                        <Button
                            colorScheme="PrimaryActionButton"
                            size="sm"
                            isLoading={submitting}
                            onClick={async () => {
                                try {
                                    setSubmitting(true);
                                    await message.addReaction({
                                        type: Chat_ReactionType_Enum.EventParticipation,
                                        data: {
                                            feedback: comment?.length ? comment : undefined,
                                            rating: selectedRating?.length ? parseInt(selectedRating, 10) : undefined,
                                        } as ParticipationReactionData,
                                        symbol: "",
                                    });
                                    setSubmitted({
                                        feedback: comment?.length ? comment : undefined,
                                        rating: selectedRating?.length ? parseInt(selectedRating, 10) : undefined,
                                    });
                                } catch (e: any) {
                                    datadogLogs.logger.error("Error submitting participation survey response", {
                                        error: e,
                                    });
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                        >
                            Submit
                        </Button>
                        <Text fontSize="sm">Participation logs close after 5 minutes.</Text>
                    </>
                ) : (
                    <>
                        <Text>
                            This event has ended. It is no longer possible to log your participation in this event.
                        </Text>
                    </>
                )
            ) : (
                <>
                    <Text>Thank you for logging your participation in this event.</Text>
                    <Text>(For a certificate of attendance, please contact your conference organizers.)</Text>
                    {submitted.rating !== undefined ? (
                        <Text>
                            You felt{" "}
                            <Twemoji
                                className="twemoji"
                                text={
                                    submitted.rating === 5
                                        ? "😍"
                                        : submitted.rating === 4
                                        ? "🙂"
                                        : submitted.rating === 3
                                        ? "😐"
                                        : submitted.rating === 2
                                        ? "😕"
                                        : submitted.rating === 1
                                        ? "☹"
                                        : ""
                                }
                            />{" "}
                            about this event.
                        </Text>
                    ) : undefined}
                    {submitted.feedback ? (
                        <VStack spacing={1} w="100%" alignItems="flex-start">
                            <Text>Your feedback:</Text>
                            <Text>{submitted.feedback}</Text>
                        </VStack>
                    ) : undefined}
                </>
            )}
        </VStack>
    );
}

function FeedbackOptions({
    name,
    options,
    value,
    onChange,
}: {
    name: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
}) {
    const { getRootProps, getRadioProps } = useRadioGroup({
        name,
        value,
        onChange,
    });

    const group: any = getRootProps();

    return (
        <HStack {...group} flexWrap="wrap" gridRowGap={2} py={2} px={[2, 4]} w="100%" justifyContent="space-around">
            {options.map((option) => {
                const radio = getRadioProps({ value: option.value });
                return (
                    <FeedbackCard key={option.value} {...radio}>
                        <Twemoji className="twemoji" text={option.label} />
                    </FeedbackCard>
                );
            })}
        </HStack>
    );
}

function FeedbackCard(props: React.PropsWithChildren<UseRadioProps>) {
    const { getInputProps, getCheckboxProps } = useRadio(props);

    const input = getInputProps();
    const checkbox: any = getCheckboxProps();

    return (
        <Box as="label">
            <input {...input} />
            <Box
                {...checkbox}
                cursor="pointer"
                borderWidth="1px"
                borderRadius="md"
                boxShadow="md"
                _checked={{
                    bg: "PrimaryActionButton.600",
                    color: "PrimaryActionButton.textColor",
                    borderColor: "PrimaryActionButton.600",
                }}
                _focus={{
                    boxShadow: "outline",
                }}
                size="xl"
                px={1}
                py={1}
                fontSize="150%"
            >
                <chakra.span whiteSpace="nowrap">{props.children}</chakra.span>
            </Box>
        </Box>
    );
}
