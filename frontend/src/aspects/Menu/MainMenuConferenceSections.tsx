import { gql } from "@apollo/client";
import { AtSignIcon, LockIcon, MinusIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    HStack,
    List,
    ListIcon,
    ListItem,
    Text,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import {
    AttendeeFieldsFragment,
    RoomPrivacy_Enum,
    SidebarChatInfoFragment,
    usePinnedChatsWithUnreadCountsSubscription,
} from "../../generated/graphql";
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

function ChatListItem({ chat, attendeeId }: { chat: SidebarChatInfoFragment; attendeeId: string }): JSX.Element {
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
            <HStack alignItems="flex-start">
                <ListIcon mt="0.7ex" as={isDM ? AtSignIcon : isPrivate ? LockIcon : MinusIcon} />{" "}
                <Text as="span">
                    {unreadCount ? `(${unreadCount})` : undefined} {chatName}
                </Text>
            </HStack>
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

export function MainMenuConferenceSections_Inner({
    rootUrl,
    confSlug,
    attendee,
}: {
    rootUrl: string;
    confSlug: string;
    attendee: AttendeeFieldsFragment;
}): JSX.Element {
    const pinnedChats = usePinnedChatsWithUnreadCountsSubscription({
        variables: {
            attendeeId: attendee.id,
        },
    });
    useEffect(() => {
        if (pinnedChats.data?.chat_Pin.length) {
            console.log("Pinned chats", pinnedChats.data?.chat_Pin);
        }
    }, [pinnedChats.data?.chat_Pin]);
    return (
        <>
            <List m={0}>
                {pinnedChats.data?.chat_Pin
                    .filter((chatPin) => chatPin.chat.enableMandatoryPin)
                    .sort((x, y) => sortChats(attendee.id, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem key={chatPin.chatId} chat={chatPin.chat} attendeeId={attendee.id} />
                    ))}
            </List>
            <Accordion defaultIndex={[0]} allowMultiple>
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            Chats
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <List>
                            {pinnedChats.data?.chat_Pin
                                .filter((chatPin) => !chatPin.chat.enableMandatoryPin)
                                .sort((x, y) => sortChats(attendee.id, x.chat, y.chat))
                                .map((chatPin) => (
                                    <ChatListItem key={chatPin.chatId} chat={chatPin.chat} attendeeId={attendee.id} />
                                ))}
                        </List>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            Section 2 title
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat.
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </>
    );
}

export default function MainMenuConferenceSections({
    rootUrl,
    confSlug,
}: {
    rootUrl: string;
    confSlug: string;
}): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user && user.user.attendees.length > 0) {
        return (
            <MainMenuConferenceSections_Inner rootUrl={rootUrl} confSlug={confSlug} attendee={user.user.attendees[0]} />
        );
    }
    return <></>;
}
