import { Box, Flex, useBreakpointValue, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouteMatch } from "react-router-dom";
import Routing from "../../AppRouting";
import { Permissions_Permission_Enum } from "../../generated/graphql";
import { GlobalChatStateContext } from "../Chat/GlobalChatStateProvider";
import { useMaybeConference } from "../Conference/useConference";
import { useConferenceCurrentUserActivePermissions } from "../Conference/useConferenceCurrentUserActivePermissions";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import LeftSidebar from "../Menu/V1/LeftSidebar";
import MainMenu, { MenuBar } from "../Menu/V1/MainMenu/MainMenu";
import RightSidebar from "../Menu/V1/RightSidebar";

export default function AppPageV1(): JSX.Element {
    const conference = useMaybeConference();
    const attendee = useMaybeCurrentRegistrant();
    const permissions = useConferenceCurrentUserActivePermissions();
    const isPermittedAccess = attendee && permissions.has(Permissions_Permission_Enum.ConferenceViewAttendees);

    const leftSidebarWidthPc = 20;
    const rightSidebarWidthPc = 20;
    const contentWidthPc = 100 - leftSidebarWidthPc - rightSidebarWidthPc;

    const { path } = useRouteMatch();
    const isAdminPage = !!useRouteMatch(`${path}/manage/`);
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

    const centerVisible = !conference || centerAlwaysVisible || (!leftVisible && !rightVisible);

    const left = useMemo(() => (conference ? <LeftSidebar /> : undefined), [conference]);
    const right = useMemo(() => (conference ? <RightSidebar /> : undefined), [conference]);
    const center = useMemo(() => <Routing />, []);

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

    const leftBar = conference ? (
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
    const rightBar = conference ? (
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

    const locationMatchSchedule = useRouteMatch([`${path}/schedule`, `${path}/schedule2`]);
    const isSchedulePage = locationMatchSchedule !== null;

    const centerBgColour = useColorModeValue(
        "AppPageV1.centerColumnBackground-light",
        "AppPageV1.centerColumnBackground-light"
    );
    const borderColour = useColorModeValue("AppPageV1.centerColumnBorders-light", "AppPageV1.centerColumnBorders-dark");
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
                role="region"
                aria-labelledby="page-heading"
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
