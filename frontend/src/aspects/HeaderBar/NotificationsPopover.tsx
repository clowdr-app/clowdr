import {
    Box,
    chakra,
    Popover,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import FAIcon from "../Chakra/FAIcon";
import { LinkButton } from "../Chakra/LinkButton";
import { Chat } from "../Chat/Chat";
import type { ChatState } from "../Chat/ChatGlobalState";
import { useGlobalChatState } from "../Chat/GlobalChatStateProvider";
import useUnreadCount from "../Chat/Hooks/useUnreadCount";
import { useConference } from "../Conference/useConference";
import HeaderBarButton from "./HeaderBarButton";

export default function NotificationsPopover(): JSX.Element {
    const conference = useConference();

    const { isOpen, onOpen, onToggle, onClose } = useDisclosure();

    const globalChatState = useGlobalChatState();
    globalChatState.openAnnouncements = onOpen;

    const bgColor = useColorModeValue(
        "MainMenuHeaderBar.backgroundColor-light",
        "MainMenuHeaderBar.backgroundColor-dark"
    );
    const buttonFocusBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonFocusBackgroundColor-light",
        "MainMenuHeaderBar.buttonFocusBackgroundColor-dark"
    );
    const textColor = useColorModeValue("MainMenuHeaderBar.textColor-light", "MainMenuHeaderBar.textColor-dark");
    const menuTextColor = useColorModeValue("black", "white");

    const [chat, setChat] = useState<ChatState | null | undefined>();
    const chatId = useMemo(
        () => ("announcementsChatId" in conference ? conference.announcementsChatId : undefined),
        [conference]
    );
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (chatId) {
            unsubscribe = globalChatState.observeChatId(chatId, setChat);
        } else {
            setChat(null);
        }
        return () => {
            unsubscribe?.();
        };
    }, [chatId, globalChatState]);

    const isVisibleRef = React.useRef<boolean>(false);
    useEffect(() => {
        const _isVisible = isOpen;
        isVisibleRef.current = _isVisible;
        if (_isVisible) {
            chat?.fixUnreadCountToZero();
        }
        return () => {
            if (_isVisible) {
                chat?.unfixUnreadCountToZero();
            }
        };
    }, [chat, isOpen]);

    const unreadCount = useUnreadCount(chat);

    return (
        <Popover isLazy isOpen={isOpen} onClose={onClose} placement="bottom" offset={[0, 6]}>
            <PopoverTrigger>
                <HeaderBarButton
                    label="Notifications"
                    iconStyle="s"
                    icon="bell"
                    onClick={onToggle}
                    mb={0}
                    bgColor={isOpen ? buttonFocusBgColor : undefined}
                >
                    {isOpen ? (
                        <Box pos="absolute" bottom={0} left={0} w="100%">
                            <svg height="7" width="100%" viewBox="0 0 10 7">
                                <polygon points="5,0 0,8 10,8" fill="white" />
                            </svg>
                        </Box>
                    ) : (
                        <chakra.span fontSize="xs" alignSelf="flex-start" mt="2ex">
                            {unreadCount}
                        </chakra.span>
                    )}
                </HeaderBarButton>
            </PopoverTrigger>
            <PopoverContent
                color={menuTextColor}
                borderColor={bgColor}
                borderRadius="2xl"
                overflow="hidden"
                minH="min(80vh - 6ex - 6px - 9px, 400px)"
                maxH="min(700px, calc(100vh - 6ex - 6px - 9px))"
                h="100%"
            >
                <PopoverHeader bgColor={bgColor} color={textColor} flex="0 0 auto">
                    Notifications
                </PopoverHeader>
                <PopoverCloseButton color={textColor} />
                <PopoverBody flex="1 1 100%" overflow="hidden" display="flex" flexDir="column" p={0}>
                    {chat && isOpen ? (
                        <Chat chat={chat} isVisible={isVisibleRef} noHeader />
                    ) : (
                        <>Your notification list is currently unavailable.</>
                    )}
                </PopoverBody>
                <PopoverFooter flex="0 0 auto">
                    {/* TODO: Make this act inline rather than a separate page */}
                    <LinkButton
                        size="xs"
                        to="/user/pushNotifications"
                        leftIcon={<FAIcon iconStyle="s" icon="envelope" />}
                    >
                        Push notifications
                    </LinkButton>
                </PopoverFooter>
            </PopoverContent>
        </Popover>
    );
}
