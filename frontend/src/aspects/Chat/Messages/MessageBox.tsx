import { Box, Button, Center, Flex, HStack, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import { AttendeeDataFragment, Chat_MessageType_Enum, Chat_ReactionType_Enum } from "../../../generated/graphql";
import { useAttendee } from "../../Conference/AttendeesContext";
import { roundUpToNearest } from "../../Generic/MathUtils";
import { Markdown } from "../../Text/Markdown";
import type { MessageState } from "../ChatGlobalState";
import { MessageTypeIndicator } from "../Compose/MessageTypeIndicator";
import { ChatSpacing, useChatConfiguration } from "../Configuration";
import MessageControls from "./MessageControls";
import PollOptions from "./PollOptions";
import ProfileBox from "./ProfileBox";
import ReactionsList from "./ReactionsList";
import { useReceiveMessageQueries } from "./ReceiveMessageQueries";

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
//             <Tag colorScheme="orange" variant="solid" borderRightRadius={0} fontSize="inherit">
//                 {children}
//             </Tag>
//             <Tag
//                 aria-label="Find out about chat reflection"
//                 color="white"
//                 backgroundColor="blue.700"
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
    attendee,
    subscribeToReactions,
}: {
    message: MessageState;
    attendee: AttendeeDataFragment | null;
    subscribeToReactions: boolean;
}): JSX.Element {
    const config = useChatConfiguration();
    const messages = useReceiveMessageQueries();
    // const conference = useConference();

    const scaleFactor = config.spacing / ChatSpacing.RELAXED;

    const pictureSizeMinPx = 35;
    const pictureSizeMaxPx = 50;
    const pictureSizeRange = pictureSizeMaxPx - pictureSizeMinPx;
    const pictureSize = Math.round(pictureSizeMinPx + pictureSizeRange * scaleFactor);

    const createdAt = useMemo(() => new Date(message.created_at), [message.created_at]);
    const timeColour = useColorModeValue("gray.600", "gray.400");
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
                    <ProfileBox attendee={attendee} w={pictureSize} />
                ) : undefined}
            </VStack>
        ),
        [
            attendee,
            config.spacing,
            createdAt,
            message.senderId,
            message.type,
            pictureSize,
            smallFontSize,
            timeColour,
            timeFormat,
        ]
    );

    const attendeeNameEl = useMemo(
        () =>
            message.type !== Chat_MessageType_Enum.Emote ? (
                <HStack>
                    <Text as="span" fontSize={smallFontSize} color={timeColour}>
                        {attendee?.displayName ?? " "}
                    </Text>
                    {attendee?.profile?.badges && attendee.profile.badges.length > 0 ? (
                        <Box
                            fontSize={smallFontSize}
                            color={attendee.profile.badges[0].colour}
                            border="1px solid"
                            borderRadius="3px"
                            borderColor={attendee.profile.badges[0].colour}
                            lineHeight="3.5ex"
                            py={0}
                            px={1}
                            m={0}
                            ml={2}
                        >
                            {attendee.profile.badges[0].name}
                        </Box>
                    ) : undefined}
                </HStack>
            ) : undefined,
        [attendee?.displayName, attendee?.profile?.badges, message.type, smallFontSize, timeColour]
    );

    const controls = useMemo(
        () => (
            <Flex flexDir="row" w="100%">
                {attendeeNameEl}
                {/* TODO: Permissions */}
                <MessageControls
                    hideReactions={message.type === Chat_MessageType_Enum.Emote}
                    fontSize={smallFontSize}
                    ml="auto"
                    isOwnMessage={!!config.currentAttendeeId && message.senderId === config.currentAttendeeId}
                    messageId={message.id}
                    usedReactions={message.reactions.reduce((acc, reaction) => {
                        if (
                            config.currentAttendeeId &&
                            reaction.type === Chat_ReactionType_Enum.Emoji &&
                            reaction.senderId === config.currentAttendeeId
                        ) {
                            return [...acc, reaction.symbol];
                        }
                        return acc;
                    }, [] as string[])}
                    isPollOpen={
                        message.type === Chat_MessageType_Enum.Poll
                            ? !message.reactions.some((reaction) => reaction.type === Chat_ReactionType_Enum.PollClosed)
                            : undefined
                    }
                    isPollIncomplete={
                        message.type === Chat_MessageType_Enum.Poll
                            ? !message.reactions.some(
                                  (reaction) => reaction.type === Chat_ReactionType_Enum.PollComplete
                              )
                            : undefined
                    }
                />
            </Flex>
        ),
        [
            attendeeNameEl,
            config.currentAttendeeId,
            message.id,
            message.reactions,
            message.senderId,
            message.type,
            smallFontSize,
        ]
    );

    const emote = useMemo(
        () =>
            message.type === Chat_MessageType_Enum.Emote ? (
                <Center fontSize={pictureSize} w="100%" pt={config.spacing}>
                    <Twemoji className="twemoji" text={message.message} />
                </Center>
            ) : (
                <Markdown restrictHeadingSize>{message.message}</Markdown>
            ),
        [config.spacing, message.message, message.type, pictureSize]
    );

    const reactions = useMemo(
        () => (
            <ReactionsList
                reactions={message.reactions}
                currentAttendeeId={config.currentAttendeeId}
                messageId={message.id}
                fontSize={smallFontSize}
                subscribeToReactions={subscribeToReactions}
            />
        ),
        [config.currentAttendeeId, message.id, message.reactions, smallFontSize, subscribeToReactions]
    );

    const question = useMemo(
        () =>
            message.type === Chat_MessageType_Enum.Question ? (
                message.reactions.some((x) => x.type === Chat_ReactionType_Enum.Answer) ? (
                    <Button
                        fontSize={smallFontSize}
                        p={config.spacing}
                        m={config.spacing}
                        colorScheme="green"
                        w="auto"
                        h="auto"
                        onClick={() => {
                            if (message.duplicatedMessageId) {
                                messages.setAnsweringQuestionId.current?.f([message.id, message.duplicatedMessageId]);
                            } else {
                                messages.setAnsweringQuestionId.current?.f([message.id]);
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
                        colorScheme="blue"
                        w="auto"
                        h="auto"
                        onClick={() => {
                            if (message.duplicatedMessageId) {
                                messages.setAnsweringQuestionId.current?.f([message.id, message.duplicatedMessageId]);
                            } else {
                                messages.setAnsweringQuestionId.current?.f([message.id]);
                            }
                        }}
                    >
                        Answer this question
                    </Button>
                )
            ) : undefined,
        [
            config.spacing,
            message.duplicatedMessageId,
            message.id,
            message.reactions,
            message.type,
            messages.setAnsweringQuestionId,
            smallFontSize,
        ]
    );

    const poll = useMemo(
        () => (message.type === Chat_MessageType_Enum.Poll ? <PollOptions message={message} /> : undefined),
        [message]
    );

    const msgBody = useMemo(
        () => (
            <VStack
                justifyContent={message.type === Chat_MessageType_Enum.Emote ? "center" : undefined}
                alignItems="flex-start"
                spacing={roundUpToNearest(config.spacing * 0.5, 1) + "px"}
                p={0}
                pr={config.spacing}
                m={0}
                w="100%"
                h={message.type === Chat_MessageType_Enum.Emote ? "100%" : "auto"}
            >
                {controls}
                {emote}
                {reactions}
                {question}
                {poll}
            </VStack>
        ),
        [config.spacing, controls, emote, message.type, poll, question, reactions]
    );

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
        //         <Divider my={config.spacing} borderColor="orange.400" w="100%" height="1px" />
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
        //                 to={`/conference/${conference.slug}/room/${data.room.id}`}
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
        //                 to={`/conference/${conference.slug}/item/${data.contentGroup.id}`}
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
        //                 <chakra.span mx={2}>{data.contentGroup.title}</chakra.span>
        //             </LinkButton>
        //         </HStack>
        //         {data.type === "start" ? (
        //             <FAIcon iconStyle="s" icon="angle-double-down" color="orange.400" aria-hidden />
        //         ) : (
        //             <FAIcon iconStyle="s" icon="angle-double-up" color="orange.400" aria-hidden />
        //         )}
        //     </Flex>
        // );
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
    subscribeToReactions,
}: {
    message: MessageState;
    subscribeToReactions: boolean;
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
        isQuestion ? "blue.100" : isAnswer ? "orange.100" : "white",
        isQuestion ? "blue.700" : isAnswer ? "green.800" : "gray.900"
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

    const attendee = useAttendee(message.senderId);

    return message.type === Chat_MessageType_Enum.DuplicationMarker ? (
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
            id={`message-${message.id}`}
            alignItems="flex-start"
            lineHeight={lineHeight + "ex"}
            _hover={{}}
            tabIndex={0}
            aria-label={`Message sent at ${createdAt.toLocaleString(undefined, timeFormat)} by ${
                attendee?.displayName ?? "<Loading name>"
            }. ${message.message}`}
        >
            <MessageBody subscribeToReactions={subscribeToReactions} attendee={attendee} message={message} />
        </HStack>
    );
}
