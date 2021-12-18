import { Box, Flex, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import { useRouteMatch } from "react-router-dom";
import { useMaybeConference } from "../Conference/useConference";
import { useAuthParameters } from "../GQL/AuthParameters";
import { useRestorableState } from "../Hooks/useRestorableState";
import MenuHeaderBar from "../Menu/HeaderBar/MenuHeaderBar";
import LeftMenu from "../Menu/LeftMenu";
import RightMenu from "../Menu/RightMenu";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import Routing from "./AppRouting";

export default function AppPage(): JSX.Element {
    const user = useMaybeCurrentUser();
    const conference = useMaybeConference();

    const bgColour = useColorModeValue("AppPage.pageBackground-light", "AppPage.pageBackground-dark");

    const { path } = useRouteMatch();
    const locationMatchRoot = useRouteMatch({
        path: "/",
        exact: true,
    });
    const locationConferenceMatchRoot = useRouteMatch({
        path,
        exact: true,
    });
    const { conferenceId } = useAuthParameters();
    const isRootPage = locationMatchRoot !== null;
    const isConferenceRootPage = !!conferenceId && locationConferenceMatchRoot !== null;

    const isAppLandingPage = isRootPage && !user?.user;

    const center = useMemo(() => <Routing />, []);

    const [rightMenuOpen, setRightMenuOpen] = useState<boolean>(false);

    const [leftMenu_IsExpanded, leftMenu_SetIsExpanded] = useRestorableState<boolean>(
        "LeftMenu_IsExpanded",
        true,
        (x) => x.toString(),
        (x) => x === "true"
    );
    const leftMenu_ToggleIsExpanded = useCallback(() => {
        leftMenu_SetIsExpanded((old) => !old);
    }, [leftMenu_SetIsExpanded]);

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
                <MenuHeaderBar setRightMenuOpen={setRightMenuOpen} toggleIsExpanded={leftMenu_ToggleIsExpanded} />
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
                {conference ? <LeftMenu isExpanded={leftMenu_IsExpanded} /> : undefined}
                <Box
                    zIndex={1}
                    overflowX="hidden"
                    overflowY="auto"
                    height="100%"
                    flex="0 1 100%"
                    p={0}
                    m={0}
                    mb="auto"
                    css={{
                        ["scrollbarWidth"]: "thin",
                    }}
                >
                    <VStack
                        spacing={5}
                        width="100%"
                        mb={isAppLandingPage || isConferenceRootPage ? 0 : "40px"}
                        role="region"
                        aria-labelledby="page-heading"
                    >
                        {center}
                    </VStack>
                </Box>
                {user.user ? <RightMenu isOpen={rightMenuOpen} /> : undefined}
            </Flex>
        </Flex>
    );
}
