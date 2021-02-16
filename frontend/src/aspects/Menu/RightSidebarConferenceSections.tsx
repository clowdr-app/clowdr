import { gql } from "@apollo/client";
import { AtSignIcon, ChatIcon, LockIcon } from "@chakra-ui/icons";
import { Button, HStack, Link, List, ListIcon, ListItem, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink, useHistory } from "react-router-dom";
import {
    AttendeeFieldsFragment,
    RoomPrivacy_Enum,
    SidebarChatInfoFragment,
    usePinnedChatsWithUnreadCountsQuery,
} from "../../generated/graphql";
import { CreateDmModal } from "../Conference/Attend/Room/CreateDmModal";
import { CreateRoomModal } from "../Conference/Attend/Room/CreateRoomModal";
import AttendeesContextProvider from "../Conference/AttendeesContext";
import ConferenceProvider from "../Conference/useConference";
import { FAIcon } from "../Icons/FAIcon";
import PresenceCountProvider from "../Presence/PresenceCountProvider";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

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
                id
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

    query PinnedChatsWithUnreadCounts($attendeeId: uuid!) {
        chat_Pin(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
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
            ? chat.DMRoom[0].roomPeople.find((x) => x?.attendee?.id !== attendeeId)?.attendee?.displayName
            : undefined
        : undefined;
}

function ChatListItem({
    chat,
    attendeeId,
    confSlug,
}: {
    chat: SidebarChatInfoFragment;
    attendeeId: string;
    confSlug: string;
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
            <Link as={ReactLink} to={`/conference/${confSlug}${chatPath}`} textDecoration="none">
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
    if (x && x.readUpToIndices?.length && x.readUpToIndices[0].unreadCount) {
        if (y && y.readUpToIndices?.length && y.readUpToIndices[0].unreadCount) {
            return compareNames();
        } else {
            return -1;
        }
    } else if (y && y.readUpToIndices?.length && y.readUpToIndices[0].unreadCount) {
        return 1;
    } else {
        return compareNames();
    }
}

function ChatsPanel({ attendeeId, confSlug }: { attendeeId: string; confSlug: string }): JSX.Element {
    const pinnedChats = usePinnedChatsWithUnreadCountsQuery({
        variables: {
            attendeeId,
        },
        pollInterval: 30000,
    });

    const { isOpen: isCreateRoomOpen, onClose: onCreateRoomClose, onOpen: onCreateRoomOpen } = useDisclosure();
    const { isOpen: isCreateDmOpen, onClose: onCreateDmClose, onOpen: onCreateDmOpen } = useDisclosure();

    const history = useHistory();

    return (
        <>
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
                    }, 2000);
                }}
            />
            <List m={0} ml={4}>
                {pinnedChats.data?.chat_Pin
                    .filter((chatPin) => chatPin.chat?.enableMandatoryPin)
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                        />
                    ))}
            </List>
            <List my={4} ml={4}>
                {pinnedChats.data?.chat_Pin
                    .filter((chatPin) => !chatPin.chat?.enableMandatoryPin)
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                        />
                    ))}
                {!pinnedChats.data || pinnedChats.data.chat_Pin.length < 1 ? <>No pinned chats.</> : <></>}
            </List>
        </>
    );
}

export function RightSidebarConferenceSections_Inner({
    confSlug,
    attendee,
    onClose,
}: {
    rootUrl: string;
    confSlug: string;
    attendee: AttendeeFieldsFragment;
    onClose: () => void;
}): JSX.Element {
    return <ChatsPanel attendeeId={attendee.id} confSlug={confSlug} />;
}

export default function RightSidebarConferenceSections({
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
                    <PresenceCountProvider>
                        <AttendeesContextProvider>
                            <RoomParticipantsProvider>
                                <RightSidebarConferenceSections_Inner
                                    rootUrl={rootUrl}
                                    confSlug={confSlug}
                                    attendee={attendee}
                                    onClose={onClose}
                                />
                            </RoomParticipantsProvider>
                        </AttendeesContextProvider>
                    </PresenceCountProvider>
                </ConferenceProvider>
            );
        }
    }
    return <></>;
}
