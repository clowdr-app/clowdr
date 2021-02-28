import { Box, Flex, useBreakpointValue, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import "./App.css";
import Routing from "./AppRouting";
import { GlobalChatStateContext, GlobalChatStateProvider } from "./aspects/Chat/GlobalChatStateProvider";
import AttendeesContextProvider from "./aspects/Conference/AttendeesContext";
import ConferenceProvider, { useMaybeConference } from "./aspects/Conference/useConference";
import ConferenceCurrentUserActivePermissionsProvider from "./aspects/Conference/useConferenceCurrentUserActivePermissions";
import { CurrentAttendeeProvider, useMaybeCurrentAttendee } from "./aspects/Conference/useCurrentAttendee";
import EmojiMartProvider from "./aspects/Emoji/EmojiMartContext";
import ForceUserRefresh from "./aspects/ForceUserRefresh/ForceUserRefresh";
import LeftSidebar from "./aspects/Menu/LeftSidebar";
import MainMenu from "./aspects/Menu/MainMenu";
import RightSidebar from "./aspects/Menu/RightSidebar";
import PresenceCountProvider from "./aspects/Presence/PresenceCountProvider";
import RoomParticipantsProvider from "./aspects/Room/RoomParticipantsProvider";
import { SharedRoomContextProvider } from "./aspects/Room/SharedRoomContextProvider";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";
// import LastSeenProvider from "./aspects/Users/CurrentUser/OnlineStatus/LastSeenProvider";

interface AppProps {
    confSlug: string | undefined;
    rootUrl: string | undefined;
}

export default function App(): JSX.Element {
    return (
        <Switch>
            <Route
                path="/conference/:confSlug"
                component={(
                    props: RouteComponentProps<{
                        confSlug: string;
                    }>
                ) => <AppInner rootUrl={props.match.url} confSlug={props.match.params.confSlug} />}
            />
            <Route path="/">
                <AppInner rootUrl={undefined} confSlug={undefined} />
            </Route>
        </Switch>
    );
}

function AppInner({ confSlug, rootUrl }: AppProps): JSX.Element {
    const page = <AppPage confSlug={confSlug} rootUrl={rootUrl} />;

    return (
        <EmojiMartProvider>
            {/* <LastSeenProvider /> */}
            <CurrentUserProvider>
                {confSlug ? (
                    <ConferenceProvider confSlug={confSlug}>
                        <ForceUserRefresh />
                        <ConferenceCurrentUserActivePermissionsProvider>
                            <CurrentAttendeeProvider>
                                <PresenceCountProvider>
                                    <GlobalChatStateProvider>
                                        <AttendeesContextProvider>
                                            <RoomParticipantsProvider>
                                                {/* <ShuffleRoomsQueueMonitor /> */}
                                                <SharedRoomContextProvider>{page}</SharedRoomContextProvider>
                                            </RoomParticipantsProvider>
                                        </AttendeesContextProvider>
                                    </GlobalChatStateProvider>
                                </PresenceCountProvider>
                            </CurrentAttendeeProvider>
                        </ConferenceCurrentUserActivePermissionsProvider>
                    </ConferenceProvider>
                ) : (
                    page
                )}
            </CurrentUserProvider>
        </EmojiMartProvider>
    );
}

function AppPage({ rootUrl }: AppProps) {
    const conference = useMaybeConference();
    const confSlug = conference?.slug;
    const attendee = useMaybeCurrentAttendee();

    const leftSidebarWidthPc = 20;
    const rightSidebarWidthPc = 20;
    const contentWidthPc = 100 - leftSidebarWidthPc - rightSidebarWidthPc;

    const bgColour = useColorModeValue("gray.50", "gray.900");

    const leftDefaultVisible = useBreakpointValue({
        base: false,
        lg: true,
    });
    const rightDefaultVisible = useBreakpointValue({
        base: false,
        xl: true,
    });
    const centerAlwaysVisible = useBreakpointValue({
        base: false,
        md: true,
    });
    const [leftOpen, setLeftOpen] = useState<boolean | null>(null);
    const [rightOpen, setRightOpen] = useState<boolean | null>(null);
    const leftVisible = attendee && !!leftOpen;
    const rightVisible = attendee && rightOpen && (rightDefaultVisible || !leftVisible);

    useEffect(() => {
        if (leftOpen === null && leftDefaultVisible !== undefined) {
            setLeftOpen(leftDefaultVisible);
        }
    }, [leftDefaultVisible, leftOpen]);

    useEffect(() => {
        if (rightOpen === null && rightDefaultVisible !== undefined) {
            setRightOpen(rightDefaultVisible);
        }
    }, [rightDefaultVisible, rightOpen]);

    const centerVisible = !confSlug || centerAlwaysVisible || (!leftVisible && !rightVisible);

    const left = useMemo(
        () => (confSlug && rootUrl ? <LeftSidebar rootUrl={rootUrl} confSlug={confSlug} /> : undefined),
        [confSlug, rootUrl]
    );
    const right = useMemo(
        () => (confSlug && rootUrl ? <RightSidebar rootUrl={rootUrl} confSlug={confSlug} /> : undefined),
        [confSlug, rootUrl]
    );
    const center = useMemo(() => <Routing rootUrl={rootUrl} />, [rootUrl]);

    const onRightBarOpen = useCallback(() => {
        if (!rightDefaultVisible) {
            setLeftOpen(false);
        }
        setRightOpen(true);
    }, [rightDefaultVisible]);
    const chatCtx = React.useContext(GlobalChatStateContext);
    useEffect(() => {
        if (chatCtx) {
            chatCtx.showSidebar = onRightBarOpen;
        }
    }, [chatCtx, onRightBarOpen]);

    const mainMenuState = useMemo(
        () => ({
            isLeftBarOpen: leftVisible ?? false,
            onLeftBarClose: () => setLeftOpen(false),
            onLeftBarOpen: () => setLeftOpen(true),
            isRightBarOpen: rightVisible ?? false,
            onRightBarClose: () => {
                setRightOpen(false);
            },
            onRightBarOpen,
        }),
        [leftVisible, onRightBarOpen, rightVisible]
    );

    const leftBar = confSlug ? (
        <Box
            overflow="hidden"
            height="100%"
            width={centerVisible ? leftSidebarWidthPc + "%" : "100%"}
            maxWidth={centerVisible ? "350px" : undefined}
            flex="1 0 300px"
            mb="auto"
            display={leftVisible ? "flex" : "none"}
        >
            {left}
        </Box>
    ) : undefined;
    const rightBar = confSlug ? (
        <Box
            overflow="hidden"
            height="100%"
            width={centerVisible ? rightSidebarWidthPc + "%" : "100%"}
            maxWidth={centerVisible ? "450px" : undefined}
            flex="1 0 300px"
            mb="auto"
            ml="auto"
            display={rightVisible ? "flex" : "none"}
        >
            {right}
        </Box>
    ) : undefined;

    const centerBgColour = useColorModeValue("gray.100", "gray.800");
    const borderColour = useColorModeValue("gray.200", "gray.600");
    const centerBar = (
        <Box
            overflowX="hidden"
            overflowY="auto"
            height="100%"
            width={contentWidthPc + "%"}
            flex="1 0 300px"
            mb="auto"
            p={2}
            position={centerVisible ? "relative" : "fixed"}
            top={centerVisible ? undefined : "100%"}
            bgColor={centerBgColour}
            borderX="1px solid"
            borderLeftColor={borderColour}
            borderRightColor={borderColour}
        >
            <VStack spacing={5} width="100%">
                {center}
                <Box h="40px" display="inline-block" flex="0 0 40px">
                    &nbsp;
                </Box>
            </VStack>
        </Box>
    );

    return (
        <Flex
            as="main"
            height="100%"
            width="100%"
            minWidth="300px"
            overflow="hidden"
            // Column-reverse allows us to put the menu last so screen
            // readers see the page content before the menu
            direction="column-reverse"
            justifyContent="center"
            alignItems="center"
            backgroundColor={bgColour}
        >
            <MainMenu state={mainMenuState}>
                <Flex w="100%" h="100%" overflow="hidden">
                    {leftBar}
                    {centerBar}
                    {rightBar}
                </Flex>
            </MainMenu>
        </Flex>
    );
}
