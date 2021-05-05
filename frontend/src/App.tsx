import { Box, Flex, useBreakpointValue, useColorModeValue, VStack } from "@chakra-ui/react";
import { darkTheme, lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Route, RouteComponentProps, Switch, useLocation, useRouteMatch } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import "./App.css";
import Routing from "./AppRouting";
import { GlobalChatStateContext, GlobalChatStateProvider } from "./aspects/Chat/GlobalChatStateProvider";
import AttendeesContextProvider from "./aspects/Conference/RegistrantsContext";
import ConferenceProvider, { useMaybeConference } from "./aspects/Conference/useConference";
import ConferenceCurrentUserActivePermissionsProvider, {
    useConferenceCurrentUserActivePermissions,
} from "./aspects/Conference/useConferenceCurrentUserActivePermissions";
import { CurrentRegistrantProvider, useMaybeCurrentRegistrant } from "./aspects/Conference/useCurrentRegistrant";
import ForceUserRefresh from "./aspects/ForceUserRefresh/ForceUserRefresh";
import LeftSidebar from "./aspects/Menu/LeftSidebar";
import MainMenu, { MenuBar } from "./aspects/Menu/MainMenu";
import RightSidebar from "./aspects/Menu/RightSidebar";
import RoomParticipantsProvider from "./aspects/Room/RoomParticipantsProvider";
import { SharedRoomContextProvider } from "./aspects/Room/SharedRoomContextProvider";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";
import { Permissions_Permission_Enum } from "./generated/graphql";

interface AppProps {
    confSlug: string | undefined;
    rootUrl: string | undefined;
}

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function App(): JSX.Element {
    const chimeTheme = useColorModeValue(lightTheme, darkTheme);

    // const query = useQuery();
    // const bypassDfmMatch = query.get("bypassMaintenance");
    // console.info("bypassDfmMatch", bypassDfmMatch);

    // if (!bypassDfmMatch) {
    //     return <DownForMaintenancePage />;
    // }

    return (
        <ThemeProvider theme={chimeTheme}>
            <MeetingProvider>
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
            </MeetingProvider>
        </ThemeProvider>
    );
}

function AppInner({ confSlug, rootUrl }: AppProps): JSX.Element {
    const page = <AppPage confSlug={confSlug} rootUrl={rootUrl} />;

    return (
        <CurrentUserProvider>
            {confSlug ? (
                <ConferenceProvider confSlug={confSlug}>
                    <ForceUserRefresh />
                    <ConferenceCurrentUserActivePermissionsProvider>
                        <CurrentRegistrantProvider>
                            <GlobalChatStateProvider>
                                <AttendeesContextProvider>
                                    <RoomParticipantsProvider>
                                        {/* <ShuffleRoomsQueueMonitor /> */}
                                        <SharedRoomContextProvider>{page}</SharedRoomContextProvider>
                                    </RoomParticipantsProvider>
                                </AttendeesContextProvider>
                            </GlobalChatStateProvider>
                        </CurrentRegistrantProvider>
                    </ConferenceCurrentUserActivePermissionsProvider>
                </ConferenceProvider>
            ) : (
                page
            )}
        </CurrentUserProvider>
    );
}

function AppPage({ rootUrl }: AppProps) {
    const conference = useMaybeConference();
    const confSlug = conference?.slug;
    const attendee = useMaybeCurrentRegistrant();
    const permissions = useConferenceCurrentUserActivePermissions();
    const isPermittedAccess = attendee && permissions.has(Permissions_Permission_Enum.ConferenceViewAttendees);

    const leftSidebarWidthPc = 20;
    const rightSidebarWidthPc = 20;
    const contentWidthPc = 100 - leftSidebarWidthPc - rightSidebarWidthPc;

    const bgColour = useColorModeValue("gray.50", "gray.900");

    const isAdminPage = !!useRouteMatch("/conference/:confSlug/manage/");
    const leftDefaultVisible = useBreakpointValue({
        base: false,
        lg: !isAdminPage,
    });
    const rightDefaultVisible = useBreakpointValue({
        base: false,
        xl: !isAdminPage,
    });
    const centerAlwaysVisible = useBreakpointValue({
        base: false,
        md: true,
    });
    const [leftOpen, setLeftOpen] = useState<boolean | null>(null);
    const [rightOpen, setRightOpen] = useState<boolean | null>(null);
    const leftVisible = isPermittedAccess && !!leftOpen;
    const rightVisible = isPermittedAccess && rightOpen && (rightDefaultVisible || !leftVisible);

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

    const locationMatchSchedule = useRouteMatch([
        `/conference/${conference?.slug ?? "NONE"}/schedule`,
        `/conference/${conference?.slug ?? "NONE"}/schedule2`,
    ]);
    const isSchedulePage = locationMatchSchedule !== null;

    const centerBgColour = useColorModeValue("gray.100", "gray.800");
    const borderColour = useColorModeValue("gray.200", "gray.600");
    const centerBar = (
        <Box
            overflowX="hidden"
            overflowY={isSchedulePage ? "hidden" : "auto"}
            height="100%"
            width={contentWidthPc + "%"}
            flex="1 0 300px"
            mb="auto"
            position={centerVisible ? "relative" : "absolute"}
            top={centerVisible ? undefined : "-100%"}
            bgColor={centerBgColour}
            borderX="1px solid"
            borderLeftColor={borderColour}
            borderRightColor={borderColour}
            display={isSchedulePage ? "flex" : undefined}
            flexDir={isSchedulePage ? "column" : undefined}
        >
            <MenuBar />
            <VStack
                spacing={5}
                width="100%"
                p={2}
                flex={isSchedulePage ? "0 1 100%" : undefined}
                overflow={isSchedulePage ? "hidden" : undefined}
            >
                {center}
                {!isSchedulePage ? (
                    <Box h="40px" display="inline-block" flex="0 0 40px">
                        &nbsp;
                    </Box>
                ) : undefined}
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
