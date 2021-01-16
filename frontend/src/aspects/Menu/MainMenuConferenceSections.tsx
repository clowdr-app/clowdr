import { gql } from "@apollo/client";
import { AtSignIcon, ChatIcon, LockIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    HStack,
    Link,
    List,
    ListIcon,
    ListItem,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink, useHistory } from "react-router-dom";
import {
    AttendeeFieldsFragment,
    RoomListRoomDetailsFragment,
    RoomPrivacy_Enum,
    SidebarChatInfoFragment,
    useGetAllRoomsQuery,
    usePinnedChatsWithUnreadCountsSubscription,
} from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { CreateDmModal } from "../Conference/Attend/Room/CreateDmModal";
import { CreateRoomModal } from "../Conference/Attend/Room/CreateRoomModal";
import { RoomList } from "../Conference/Attend/Room/RoomList";
import ConferenceProvider, { useConference } from "../Conference/useConference";
import ApolloQueryWrapper from "../GQL/ApolloQueryWrapper";
import { FAIcon } from "../Icons/FAIcon";
import PresenceCountProvider from "../Presence/PresenceCountProvider";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import useLazyRenderAndRetain from "./LazyRenderAndRetain";
import { MainMenuProgram } from "./MainMenuProgram";

gql`
    fragment SidebarChatInfo on chat_Chat {
        id
        contentGroup {
            id
            title
            shortTitle
        }
        nonDMRoom: room(where: { roomPrivacyName: { _neq: DM } }) {
            id
            name
            priority
            roomPrivacyName
        }
        DMRoom: room(where: { roomPrivacyName: { _eq: DM } }) {
            id
            name
            roomPeople {
                attendee {
                    id
                    displayName
                }
            }
        }
        enableAutoPin
        enableAutoSubscribe
        enableMandatoryPin
        enableMandatorySubscribe
        readUpToIndices(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            unreadCount
        }
    }

    subscription PinnedChatsWithUnreadCounts($attendeeId: uuid!) {
        chat_Pin(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            wasManuallyPinned
            chat {
                ...SidebarChatInfo
            }
        }
    }
`;

function computeChatName(chat: SidebarChatInfoFragment, attendeeId: string): string | undefined {
    return chat
        ? chat.contentGroup.length > 0
            ? chat.contentGroup[0].shortTitle ?? chat.contentGroup[0].title
            : chat.nonDMRoom.length > 0
            ? chat.nonDMRoom[0].name
            : chat.DMRoom.length > 0
            ? chat.DMRoom[0].roomPeople.find((x) => x.attendee.id !== attendeeId)?.attendee.displayName
            : undefined
        : undefined;
}

function ChatListItem({
    chat,
    attendeeId,
    confSlug,
    onClose,
}: {
    chat: SidebarChatInfoFragment;
    attendeeId: string;
    confSlug: string;
    onClose: () => void;
}): JSX.Element {
    const chatName = computeChatName(chat, attendeeId);
    const chatPath = chat
        ? chat.contentGroup.length > 0
            ? `/item/${chat.contentGroup[0].id}`
            : chat.nonDMRoom.length > 0
            ? `/room/${chat.nonDMRoom[0].id}`
            : chat.DMRoom.length > 0
            ? `/room/${chat.DMRoom[0].id}`
            : undefined
        : undefined;
    const unreadCount =
        chat && chat.readUpToIndices && chat.readUpToIndices.length > 0
            ? chat.readUpToIndices[0].unreadCount ?? undefined
            : undefined;
    const isDM = chat && chat.DMRoom.length;
    const isPrivate = chat && chat.nonDMRoom.length && chat.nonDMRoom[0].roomPrivacyName !== RoomPrivacy_Enum.Public;

    return (
        <ListItem key={chat.id} fontWeight={unreadCount ? "bold" : undefined}>
            <Link as={ReactLink} to={`/conference/${confSlug}${chatPath}`} onClick={onClose} textDecoration="none">
                <HStack alignItems="flex-start">
                    <ListIcon mt="0.7ex" as={isDM ? AtSignIcon : isPrivate ? LockIcon : ChatIcon} />{" "}
                    <Text as="span">
                        {unreadCount ? `(${unreadCount})` : undefined} {chatName}
                    </Text>
                </HStack>
            </Link>
        </ListItem>
    );
}

function sortChats(attendeeId: string, x: SidebarChatInfoFragment, y: SidebarChatInfoFragment): number {
    function compareNames() {
        const chatNameX = computeChatName(x, attendeeId);
        const chatNameY = computeChatName(y, attendeeId);
        if (chatNameX) {
            if (chatNameY) {
                return chatNameX.localeCompare(chatNameY);
            } else {
                return -1;
            }
        } else if (chatNameY) {
            return 1;
        } else {
            return 0;
        }
    }
    if (x.readUpToIndices?.length && x.readUpToIndices[0].unreadCount) {
        if (y.readUpToIndices?.length && y.readUpToIndices[0].unreadCount) {
            return compareNames();
        } else {
            return -1;
        }
    } else if (y.readUpToIndices?.length && y.readUpToIndices[0].unreadCount) {
        return 1;
    } else {
        return compareNames();
    }
}

function ChatsPanel({
    attendeeId,
    onClose,
    confSlug,
}: {
    attendeeId: string;
    onClose: () => void;
    confSlug: string;
}): JSX.Element {
    const pinnedChats = usePinnedChatsWithUnreadCountsSubscription({
        variables: {
            attendeeId,
        },
    });

    const { isOpen: isCreateRoomOpen, onClose: onCreateRoomClose, onOpen: onCreateRoomOpen } = useDisclosure();
    const { isOpen: isCreateDmOpen, onClose: onCreateDmClose, onOpen: onCreateDmOpen } = useDisclosure();

    const history = useHistory();

    return (
        <AccordionPanel pb={4} px={"3px"}>
            <HStack justifyContent="flex-end">
                <Button onClick={onCreateRoomOpen} colorScheme="green" size="sm">
                    <FAIcon icon="plus-square" iconStyle="s" mr={3} /> New room
                </Button>
                <Button onClick={onCreateDmOpen} colorScheme="green" size="sm">
                    <FAIcon icon="plus-square" iconStyle="s" mr={3} /> DM
                </Button>
            </HStack>
            <CreateRoomModal
                isOpen={isCreateRoomOpen}
                onClose={onCreateRoomClose}
                onCreated={async (id: string) => {
                    // Wait, because Vonage session creation is not instantaneous
                    setTimeout(() => {
                        history.push(`/conference/${confSlug}/room/${id}`);
                        onClose();
                    }, 2000);
                }}
            />
            <CreateDmModal
                isOpen={isCreateDmOpen}
                onClose={onCreateDmClose}
                onCreated={async (id: string) => {
                    // Wait, because Vonage session creation is not instantaneous
                    setTimeout(() => {
                        history.push(`/conference/${confSlug}/room/${id}`);
                        onClose();
                    }, 2000);
                }}
            />
            <List m={0}>
                {pinnedChats.data?.chat_Pin
                    .filter((chatPin) => chatPin.chat.enableMandatoryPin)
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                            onClose={onClose}
                        />
                    ))}
            </List>
            <List my={4}>
                {pinnedChats.data?.chat_Pin
                    .filter((chatPin) => !chatPin.chat.enableMandatoryPin)
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                            onClose={onClose}
                        />
                    ))}
                {!pinnedChats.data || pinnedChats.data.chat_Pin.length < 1 ? <>No pinned chats.</> : <></>}
            </List>
        </AccordionPanel>
    );
}

function LazyChatsPanel({
    isExpanded,
    attendeeId,
    onClose,
    confSlug,
}: {
    isExpanded: boolean;
    attendeeId: string;
    onClose: () => void;
    confSlug: string;
}): JSX.Element {
    return useLazyRenderAndRetain(
        () => <ChatsPanel attendeeId={attendeeId} onClose={onClose} confSlug={confSlug} />,
        isExpanded
    );
}

function RoomsPanel({ onClose, confSlug }: { onClose: () => void; confSlug: string }): JSX.Element {
    const conference = useConference();

    const result = useGetAllRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    return (
        <AccordionPanel pb={4} px={"3px"}>
            <ApolloQueryWrapper getter={(data) => data.Room} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout="list" limit={5} onClick={onClose} />
                )}
            </ApolloQueryWrapper>
            <LinkButton
                onClick={onClose}
                to={`/conference/${confSlug}/rooms`}
                colorScheme="green"
                linkProps={{ mt: 4, width: "100%" }}
                w="100%"
            >
                View all rooms
            </LinkButton>
        </AccordionPanel>
    );
}

function LazyRoomsPanel({
    isExpanded,
    onClose,
    confSlug,
}: {
    isExpanded: boolean;
    onClose: () => void;
    confSlug: string;
}): JSX.Element {
    return useLazyRenderAndRetain(() => <RoomsPanel onClose={onClose} confSlug={confSlug} />, isExpanded);
}

function SchedulePanel(): JSX.Element {
    return (
        <AccordionPanel pb={4} px={"3px"}>
            <MainMenuProgram />
        </AccordionPanel>
    );
}

function LazySchedulePanel({ isExpanded }: { isExpanded: boolean }): JSX.Element {
    return useLazyRenderAndRetain(() => <SchedulePanel />, isExpanded);
}

export function MainMenuConferenceSections_Inner({
    confSlug,
    attendee,
    onClose,
}: {
    rootUrl: string;
    confSlug: string;
    attendee: AttendeeFieldsFragment;
    onClose: () => void;
}): JSX.Element {
    return (
        <>
            <Flex my={4} justifyContent="space-evenly" alignItems="center" flexWrap="wrap" gridGap={2}>
                <LinkButton
                    linkProps={{ flexBasis: ["40%", "40%", "min-content"], flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    onClick={onClose}
                    to={`/conference/${confSlug}`}
                    width="100%"
                >
                    <FAIcon icon="home" iconStyle="s" mr={3} />
                    Home
                </LinkButton>
                <LinkButton
                    linkProps={{ flexBasis: ["40%", "40%", "min-content"], flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    onClick={onClose}
                    to={`/conference/${confSlug}/schedule`}
                    width="100%"
                >
                    <FAIcon icon="calendar" iconStyle="r" mr={3} />
                    Schedule
                </LinkButton>
                <LinkButton
                    linkProps={{ flexBasis: ["40%", "40%", "min-content"], flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    onClick={onClose}
                    to={`/conference/${confSlug}/attendees`}
                    width="100%"
                >
                    <FAIcon icon="mug-hot" iconStyle="s" mr={3} />
                    Attendees
                </LinkButton>
                <LinkButton
                    linkProps={{ flexBasis: ["40%", "40%", "min-content"], flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    onClick={onClose}
                    to={`/conference/${confSlug}/rooms`}
                    width="100%"
                >
                    <FAIcon icon="mug-hot" iconStyle="s" mr={3} />
                    Rooms
                </LinkButton>
            </Flex>
            <Accordion defaultIndex={[0]}>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    Chats
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <LazyChatsPanel
                                isExpanded={isExpanded}
                                attendeeId={attendee.id}
                                onClose={onClose}
                                confSlug={confSlug}
                            />
                        </>
                    )}
                </AccordionItem>

                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    Rooms
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <LazyRoomsPanel isExpanded={isExpanded} onClose={onClose} confSlug={confSlug} />
                        </>
                    )}
                </AccordionItem>

                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    Schedule
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <LazySchedulePanel isExpanded={isExpanded} />
                        </>
                    )}
                </AccordionItem>
            </Accordion>
        </>
    );
}

export default function MainMenuConferenceSections({
    rootUrl,
    confSlug,
    onClose,
}: {
    rootUrl: string;
    confSlug: string;
    onClose: () => void;
}): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user && user.user.attendees.length > 0) {
        const attendee = user.user.attendees.find((x) => x.conference.slug === confSlug);
        if (attendee) {
            return (
                <ConferenceProvider confSlug={confSlug}>
                    <PresenceCountProvider disableSubscription>
                        <RoomParticipantsProvider>
                            <MainMenuConferenceSections_Inner
                                rootUrl={rootUrl}
                                confSlug={confSlug}
                                attendee={attendee}
                                onClose={onClose}
                            />
                        </RoomParticipantsProvider>
                    </PresenceCountProvider>
                </ConferenceProvider>
            );
        }
    }
    return <></>;
}
