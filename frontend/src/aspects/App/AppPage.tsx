import { Box, Flex, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useRouteMatch } from "react-router-dom";
import { useMaybeConference } from "../Conference/useConference";
import { useAuthParameters } from "../GQL/AuthParameters";
import HeaderBar from "../HeaderBar/HeaderBar";
import useIsNarrowView from "../Hooks/useIsNarrowView";
import { useRestorableState } from "../Hooks/useRestorableState";
import LeftMenu from "../Menu/LeftMenu";
import RightMenu from "../Menu/RightMenu";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { AppLayoutContext } from "./AppLayoutContext";
import Routing from "./AppRouting";

export default function AppPage(): JSX.Element {
    const user = useMaybeCurrentUser();
    const conference = useMaybeConference();
    const authParams = useAuthParameters();

    const bgColour = useColorModeValue("AppPage.pageBackground-light", "AppPage.pageBackground-dark");

    const locationMatchRoot = useRouteMatch({
        path: "/",
        exact: true,
    });
    const isRootPage = locationMatchRoot !== null;
    const isAppLandingPage = isRootPage && !user?.user;

    const { mainPaneRef } = useContext(AppLayoutContext);

    const center = useMemo(() => <Routing />, []);

    const [rightMenuOpen, setRightMenuOpen] = useState<boolean>(false);
    const locationMatchRoom = useRouteMatch({
        path: authParams.conferencePath + "/room",
        exact: false,
    });
    const locationMatchItem = useRouteMatch({
        path: authParams.conferencePath + "/item",
        exact: false,
    });
    const isRoomPage = locationMatchRoom !== null;
    const isItemPage = locationMatchItem !== null;
    const isRoomOrItemPage = isRoomPage || isItemPage;

    const narrowView = useIsNarrowView();
    const [leftMenu_IsExpanded, leftMenu_SetIsExpanded] = useRestorableState<boolean>(
        "LeftMenu_IsExpanded",
        true,
        (x) => x.toString(),
        (x) => x === "true"
    );
    const [leftMenu_IsOpen, leftMenu_SetIsOpen] = useState<boolean>(false);
    const leftMenu_ToggleIsExpanded = useCallback(() => {
        if (!narrowView) {
            leftMenu_SetIsExpanded((old) => !old);
        } else {
            leftMenu_SetIsOpen((old) => !old);
        }
    }, [leftMenu_SetIsExpanded, narrowView]);

    const location = useLocation();
    useEffect(() => {
        leftMenu_SetIsOpen(false);
        if (isRoomOrItemPage && !narrowView) {
            setRightMenuOpen(true);
        } else if (narrowView) {
            setRightMenuOpen(false);
        }
    }, [isRoomOrItemPage, location, narrowView]);

    return (
        <Flex
            as="main"
            height="100vh"
            width="100vw"
            minWidth="300px"
            overflow="hidden"
            direction="column"
            justifyContent="center"
            alignItems="center"
            backgroundColor={bgColour}
        >
            {!user.user && isAppLandingPage ? undefined : (
                <HeaderBar
                    leftMenuOpen={leftMenu_IsOpen}
                    rightMenuOpen={rightMenuOpen}
                    setRightMenuOpen={setRightMenuOpen}
                    toggleLeftMenu={leftMenu_ToggleIsExpanded}
                />
            )}
            <Flex
                as="main"
                height="100%"
                width="100%"
                minWidth="300px"
                overflow="hidden"
                direction="row"
                justifyContent="center"
                alignItems="center"
                backgroundColor={bgColour}
            >
                {conference ? (
                    <LeftMenu
                        isExpanded={narrowView ? leftMenu_IsOpen : leftMenu_IsExpanded}
                        setIsExpanded={leftMenu_ToggleIsExpanded}
                    />
                ) : undefined}
                <Box zIndex={1} height="100%" flex="0 1 100%" pos="relative" overflow="hidden">
                    <VStack
                        spacing={5}
                        overflowX="hidden"
                        overflowY="auto"
                        width="100%"
                        height="100%"
                        p={0}
                        m={0}
                        role="region"
                        aria-labelledby="page-heading"
                        css={{
                            ["scrollbarWidth"]: "thin",
                        }}
                        ref={mainPaneRef}
                    >
                        {center}
                    </VStack>
                </Box>
                {user.user ? <RightMenu isOpen={rightMenuOpen} setIsOpen={setRightMenuOpen} /> : undefined}
            </Flex>
        </Flex>
    );
}
