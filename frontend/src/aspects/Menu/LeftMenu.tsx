import { Box, Flex, useColorModeValue, useDisclosure, useToken } from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useEffect, useMemo } from "react";
import { Link as ReactLink, useLocation } from "react-router-dom";
import { useCountSwagBagsQuery, useGetSocialRoomsQuery } from "../../generated/graphql";
import RequireRole from "../Conference/RequireRole";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { useAuthParameters } from "../GQL/AuthParameters";
import { makeContext } from "../GQL/make-context";
import useIsNarrowView from "../Hooks/useIsNarrowView";
import useIsVeryNarrowView from "../Hooks/useIsVeryNarrowView";
import { useLiveEvents } from "../LiveEvents/LiveEvents";
import useRoomParticipants from "../Room/useRoomParticipants";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import Content from "./LeftSidebar/Content";
import Exhibitions from "./LeftSidebar/Exhibitions";
import LiveNow from "./LeftSidebar/LiveNow";
import Pullout from "./LeftSidebar/Pullout";
import Schedule from "./LeftSidebar/Schedule";
import Socialise from "./LeftSidebar/Socialise";
import Sponsors from "./LeftSidebar/Sponsors";
import MenuButton from "./MenuButton";

gql`
    query CountSwagBags($conferenceId: uuid!) @cached {
        content_Item_aggregate(where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: SWAG_BAG } }) {
            aggregate {
                count
            }
        }
    }
`;

export default function LeftMenu({
    isExpanded,
    setIsExpanded,
}: {
    isExpanded: boolean;
    setIsExpanded: (value: boolean | ((old: boolean) => boolean)) => void;
}): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const maybeUser = useMaybeCurrentUser()?.user;
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const colorScheme = "LeftMenuButton";

    const [swagBagsResponse] = useCountSwagBagsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pause: !maybeUser,
    });
    const hasSwagBags = Boolean(swagBagsResponse.data?.content_Item_aggregate.aggregate?.count);

    const liveNowDisclosure = useDisclosure();
    const scheduleDisclosure = useDisclosure();
    const contentDisclosure = useDisclosure();
    const exhibitionsDisclosure = useDisclosure();
    const socialiseDisclosure = useDisclosure();
    const sponsorsDisclosure = useDisclosure();

    const getSocialRoomsContext = useMemo(
        () =>
            makeContext({
                [AuthHeader.IncludeRoomIds]: "true",
            }),
        []
    );
    const [socialRoomsResult] = useGetSocialRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
        context: getSocialRoomsContext,
    });
    const socialRoomIds = useMemo(
        () => socialRoomsResult.data?.room_Room.map((x) => x.id),
        [socialRoomsResult.data?.room_Room]
    );
    const socialRoomParticipants = useRoomParticipants(socialRoomIds);
    const countOfSocialRoomParticipants = useMemo(
        () =>
            socialRoomParticipants
                ? Object.values(socialRoomParticipants).reduce((acc, x) => acc + (x?.length ?? 0), 0)
                : undefined,
        [socialRoomParticipants]
    );

    const { liveEvents, upcomingEvents } = useLiveEvents();
    const liveEventCount = liveEvents.length + upcomingEvents.length;
    const showLive = liveEventCount > 0;

    const bgColor = useColorModeValue("LeftMenu.500", "LeftMenu.200");
    const triangleBgColor = useColorModeValue("gray.50", "gray.700");
    const triangleBgColorToken = useToken("colors", triangleBgColor);
    const narrowView = useIsNarrowView();
    const veryNarrowView = useIsVeryNarrowView();

    useEffect(() => {
        if (narrowView && isExpanded) {
            liveNowDisclosure.onClose();
        }
    }, [narrowView, isExpanded, liveNowDisclosure]);

    const onPullOut = useCallback(
        (disclosure: typeof liveNowDisclosure) => {
            if (disclosure.isOpen && !narrowView) {
                disclosure.onClose();
            } else {
                disclosure.onOpen();
            }
            if (narrowView) {
                setIsExpanded(false);
            }
        },
        [narrowView, setIsExpanded]
    );

    const location = useLocation();
    useEffect(() => {
        liveNowDisclosure.onClose();
        scheduleDisclosure.onClose();
        contentDisclosure.onClose();
        exhibitionsDisclosure.onClose();
        socialiseDisclosure.onClose();
        sponsorsDisclosure.onClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <>
            <Flex
                pos={narrowView ? "absolute" : "relative"}
                w={isExpanded ? (narrowView ? "100%" : "9rem") : narrowView ? "0" : "3rem"}
                h={narrowView ? "calc(100% - 6ex - 6px)" : "100%"}
                top={narrowView ? "calc(6ex + 6px)" : "0"}
                left={0}
                zIndex={3}
                flexDir="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                flex="0 0 auto"
                overflow="visible"
                transition="width 0.15s cubic-bezier(0.33, 1, 0.68, 1)"
            >
                <Pullout
                    isIn={liveNowDisclosure.isOpen}
                    isMenuExpanded={isExpanded}
                    onClose={liveNowDisclosure.onClose}
                    menuButtonId="live-now-menu-button"
                >
                    <LiveNow />
                </Pullout>
                <Pullout
                    isIn={scheduleDisclosure.isOpen}
                    isMenuExpanded={isExpanded}
                    onClose={scheduleDisclosure.onClose}
                    menuButtonId="schedule-menu-button"
                    noOverflowY
                    noPadding
                >
                    <Schedule />
                </Pullout>
                <Pullout
                    isIn={contentDisclosure.isOpen}
                    isMenuExpanded={isExpanded}
                    onClose={contentDisclosure.onClose}
                    menuButtonId="content-menu-button"
                >
                    <Content />
                </Pullout>
                <Pullout
                    isIn={exhibitionsDisclosure.isOpen}
                    isMenuExpanded={isExpanded}
                    onClose={exhibitionsDisclosure.onClose}
                    menuButtonId="exhibitions-menu-button"
                >
                    <Exhibitions />
                </Pullout>
                <Pullout
                    isIn={sponsorsDisclosure.isOpen}
                    isMenuExpanded={isExpanded}
                    onClose={sponsorsDisclosure.onClose}
                    menuButtonId="sponsors-menu-button"
                >
                    <Sponsors />
                </Pullout>
                <Pullout
                    isIn={socialiseDisclosure.isOpen}
                    isMenuExpanded={isExpanded}
                    onClose={socialiseDisclosure.onClose}
                    menuButtonId="socialise-menu-button"
                >
                    <Socialise />
                </Pullout>
                <Flex
                    bgColor={bgColor}
                    w="100%"
                    h="100%"
                    flex="0 0 100%"
                    flexDir="column"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    overflow="hidden"
                    zIndex={2}
                >
                    {showLive ? (
                        <MenuButton
                            id="live-now-menu-button"
                            label="Live now"
                            iconStyle="s"
                            icon="podcast"
                            borderBottomRadius={0}
                            colorScheme="LiveActionButton"
                            onClick={() => onPullOut(liveNowDisclosure)}
                            mb={1}
                            showLabel={isExpanded}
                        >
                            {liveNowDisclosure.isOpen ? (
                                <Box pos="absolute" top={0} right={0} h="100%">
                                    <svg width="7" height="100%" viewBox="0 0 7 10">
                                        <polygon points="0,5 8,0 8,10" fill={triangleBgColorToken} />
                                    </svg>
                                </Box>
                            ) : (
                                <Box pos="absolute" top={1} right={1} fontSize="xs">
                                    {liveEventCount}
                                </Box>
                            )}
                        </MenuButton>
                    ) : undefined}
                    <MenuButton
                        id="schedule-menu-button"
                        label="Schedule"
                        iconStyle="s"
                        icon={"calendar"}
                        px={0}
                        borderRadius={0}
                        colorScheme={colorScheme}
                        onClick={() => onPullOut(scheduleDisclosure)}
                        as={narrowView ? ReactLink : undefined}
                        to={narrowView ? `${conferencePath}/schedule` : undefined}
                        mb={1}
                        showLabel={isExpanded}
                    />
                    <MenuButton
                        id="content-menu-button"
                        label="Content"
                        iconStyle="s"
                        icon={"tag"}
                        px={0}
                        borderRadius={0}
                        colorScheme={colorScheme}
                        onClick={() => onPullOut(contentDisclosure)}
                        as={narrowView ? ReactLink : undefined}
                        to={narrowView ? `${conferencePath}/content` : undefined}
                        mb={1}
                        showLabel={isExpanded}
                    />
                    <MenuButton
                        id="exhibitions-menu-button"
                        label="Exhibitions"
                        iconStyle="s"
                        icon={"puzzle-piece"}
                        px={0}
                        borderRadius={0}
                        colorScheme={colorScheme}
                        onClick={() => onPullOut(exhibitionsDisclosure)}
                        as={narrowView ? ReactLink : undefined}
                        to={narrowView ? `${conferencePath}/exhibitions` : undefined}
                        mb={1}
                        showLabel={isExpanded}
                    />
                    {conference.forceSponsorsMenuLink?.[0]?.value || narrowView ? (
                        <MenuButton
                            id="sponsors-menu-button"
                            label={conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
                            iconStyle="s"
                            icon={"star"}
                            px={0}
                            borderRadius={0}
                            colorScheme={colorScheme}
                            onClick={() => onPullOut(sponsorsDisclosure)}
                            as={narrowView ? ReactLink : undefined}
                            to={narrowView ? `${conferencePath}/sponsors` : undefined}
                            mb={1}
                            showLabel={isExpanded}
                        />
                    ) : undefined}
                    {maybeRegistrant ? (
                        <>
                            <MenuButton
                                id="socialise-menu-button"
                                label="Socialise"
                                ariaLabel={
                                    countOfSocialRoomParticipants
                                        ? `Socialise: ${countOfSocialRoomParticipants} ${
                                              countOfSocialRoomParticipants === 1 ? "person" : "people"
                                          } connected`
                                        : "Socialise"
                                }
                                iconStyle="s"
                                icon="mug-hot"
                                borderRadius={0}
                                colorScheme={colorScheme}
                                pos="relative"
                                onClick={() => onPullOut(socialiseDisclosure)}
                                as={narrowView ? ReactLink : undefined}
                                to={narrowView ? `${conferencePath}/socialise` : undefined}
                                mb={1}
                                showLabel={isExpanded}
                            >
                                {countOfSocialRoomParticipants ? (
                                    <Box pos="absolute" top={1} right={1} fontSize="xs">
                                        {countOfSocialRoomParticipants}
                                    </Box>
                                ) : undefined}
                            </MenuButton>
                            {hasSwagBags ? (
                                <MenuButton
                                    label={"Swag"}
                                    iconStyle="s"
                                    icon={"gift"}
                                    px={0}
                                    borderRadius={0}
                                    colorScheme={colorScheme}
                                    as={ReactLink}
                                    to={`${conferencePath}/swag`}
                                    mb={1}
                                    showLabel={isExpanded}
                                />
                            ) : undefined}
                        </>
                    ) : undefined}
                    {veryNarrowView ? (
                        <MenuButton
                            id="search-menu-button"
                            label="Search"
                            iconStyle="s"
                            icon={"search"}
                            px={0}
                            borderRadius={0}
                            colorScheme={colorScheme}
                            as={ReactLink}
                            to={`${conferencePath}/search`}
                            mb={1}
                            showLabel={isExpanded}
                        />
                    ) : undefined}
                    <Box flex="1 1 auto" />
                    <RequireRole organizerRole moderatorRole permitIfAnySubconference>
                        <MenuButton
                            id="manage-menu-button"
                            label="Manage"
                            iconStyle="s"
                            icon="cog"
                            borderRadius={0}
                            colorScheme={colorScheme}
                            as={ReactLink}
                            to={`${conferencePath}/manage`}
                            mb={1}
                            showLabel={isExpanded}
                        />
                    </RequireRole>
                </Flex>
            </Flex>
        </>
    );
}
