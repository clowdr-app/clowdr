import { Box, Flex, useBreakpointValue, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Routing from "../../AppRouting";
import { Permissions_Permission_Enum } from "../../generated/graphql";
import { GlobalChatStateContext } from "../Chat/GlobalChatStateProvider";
import { useMaybeConference } from "../Conference/useConference";
import { useConferenceCurrentUserActivePermissions } from "../Conference/useConferenceCurrentUserActivePermissions";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import MainMenu from "../Menu/V1/MainMenu/MainMenu";
import LeftMenu from "../Menu/V2/LeftMenu";
import RightMenu from "../Menu/V2/RightMenu";

export default function AppPageV2(): JSX.Element {
    const conference = useMaybeConference();
    const confSlug = conference?.slug;
    const attendee = useMaybeCurrentRegistrant();
    const permissions = useConferenceCurrentUserActivePermissions();
    const isPermittedAccess = !!attendee && permissions.has(Permissions_Permission_Enum.ConferenceViewAttendees);

    const rightSidebarWidthPc = 20;

    const bgColour = useColorModeValue("gray.50", "gray.900");

    // const isAdminPage = !!useRouteMatch("/conference/:confSlug/manage/");
    const centerAlwaysVisible = useBreakpointValue({
        base: false,
        md: true,
    });
    const [rightOpen, setRightOpen] = useState<boolean>(false);
    const rightVisible = isPermittedAccess && !!rightOpen;

    const centerVisible = !confSlug || centerAlwaysVisible || !rightVisible;

    const center = useMemo(() => <Routing confSlug={confSlug} />, [confSlug]);

    const onRightBarOpen = useCallback(() => {
        setRightOpen(true);
    }, []);
    const chatCtx = React.useContext(GlobalChatStateContext);
    useEffect(() => {
        if (chatCtx) {
            chatCtx.showSidebar = onRightBarOpen;
        }
    }, [chatCtx, onRightBarOpen]);

    const mainMenuState = useMemo(
        () => ({
            isLeftBarOpen: true,
            onLeftBarClose: () => {
                /* EMPTY */
            },
            onLeftBarOpen: () => {
                /* EMPTY */
            },
            isRightBarOpen: rightVisible ?? false,
            onRightBarClose: () => {
                setRightOpen(false);
            },
            onRightBarOpen,
        }),
        [onRightBarOpen, rightVisible]
    );

    const leftBar = useMemo(() => (confSlug ? <LeftBar /> : undefined), [confSlug]);
    const rightBar = useMemo(
        () => (
            <RightBar
                centerVisible={centerVisible}
                rightVisible={rightVisible}
                rightSidebarWidthPc={rightSidebarWidthPc}
            />
        ),
        [centerVisible, rightVisible]
    );

    // const locationMatchSchedule = useRouteMatch([
    //     `/conference/${conference?.slug ?? "NONE"}/schedule`,
    //     `/conference/${conference?.slug ?? "NONE"}/schedule2`,
    // ]);
    // const isSchedulePage = locationMatchSchedule !== null;

    const borderColour = useColorModeValue("gray.200", "gray.600");
    const centerBar = (
        <Box
            zIndex={1}
            overflowX="hidden"
            overflowY="auto"
            height="100%"
            flex="1 0 300px"
            mb="auto"
            position={centerVisible ? "relative" : "absolute"}
            top={centerVisible ? undefined : "-100%"}
            borderRight={rightVisible ? "1px solid" : undefined}
            borderRightColor={borderColour}
            css={{
                ["scrollbarWidth"]: "thin",
            }}
            ml={[2, 2, 2, 4]}
            mr={rightVisible ? 0 : [2, 2, 2, 4]}
            pr={rightVisible ? 2 : 0}
        >
            <VStack
                mt={2}
                spacing={5}
                width="100%"
                mb="40px"
                overflow="hidden"
                role="region"
                aria-labelledby="page-heading"
            >
                {center}
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
            direction="row"
            justifyContent="center"
            alignItems="center"
            backgroundColor={bgColour}
        >
            <MainMenu state={mainMenuState}>
                {leftBar}
                {centerBar}
                {rightBar}
            </MainMenu>
        </Flex>
    );
}

function LeftBar(): JSX.Element {
    return (
        <Box
            zIndex={2}
            overflow="visible"
            height="100%"
            width="auto"
            flex="0 1 auto"
            display="flex"
            flexDir="column"
            alignItems="stretch"
            justifyContent="center"
        >
            <LeftMenu />
        </Box>
    );
}

function RightBar({
    centerVisible,
    rightVisible,
    rightSidebarWidthPc,
}: {
    centerVisible: boolean;
    rightVisible: boolean;
    rightSidebarWidthPc: number;
}): JSX.Element {
    return (
        <Box
            zIndex={2}
            overflow={"visible"}
            height="100%"
            width={rightVisible ? (centerVisible ? rightSidebarWidthPc + "%" : "100%") : "auto"}
            maxWidth={centerVisible ? "550px" : undefined}
            flex={rightVisible ? "1 0 300px" : "0 1 auto"}
            display="flex"
            flexDir="column"
            alignItems={"stretch"}
            justifyContent={"center"}
        >
            <RightMenu isVisible={rightVisible} />
        </Box>
    );
}
