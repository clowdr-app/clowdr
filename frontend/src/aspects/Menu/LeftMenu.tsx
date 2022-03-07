import { Box, Flex, Link, useColorModeValue, useToken } from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useEffect, useMemo } from "react";
import { Link as ReactLink, useLocation } from "react-router-dom";
import { useCountSwagBagsQuery, useGetSocialRoomsQuery } from "../../generated/graphql";
import { useSocialiseModal } from "../Conference/Attend/Rooms/SocialiseModalProvider";
import { useLiveProgramRooms } from "../Conference/Attend/Rooms/useLiveProgramRooms";
import { ProgramModalTab, useScheduleModal } from "../Conference/Attend/Schedule/ProgramModal";
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
import LiveNow from "./LeftSidebar/LiveNow";
import MenuButton from "./MenuButton";
import { useNavigationState } from "./NavigationState";

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

    const location = useLocation();

    const { onOpen: schedule_OnOpen, onClose: schedule_OnClose, finalFocusRef: scheduleButtonRef } = useScheduleModal();
    const {
        onOpen: socialise_OnOpen,
        onClose: socialise_OnClose,
        finalFocusRef: socialiseButtonRef,
    } = useSocialiseModal();
    const {
        onOpen: liveNow_OnOpen,
        onClose: liveNow_OnClose,
        finalFocusRef: liveNowButtonRef,
        isOpen: liveNow_IsOpen,
    } = useLiveProgramRooms();

    useEffect(() => {
        liveNow_OnClose();
        schedule_OnClose();
        socialise_OnClose();
    }, [location.pathname, liveNow_OnClose, schedule_OnClose, socialise_OnClose]);

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

    const { liveEventsByRoom } = useLiveEvents();
    const liveRoomCount = Object.keys(liveEventsByRoom).length;
    const showLive = liveRoomCount > 0;

    const bgColor = useColorModeValue("LeftMenu.500", "LeftMenu.200");
    const triangleBgColor = useColorModeValue("gray.50", "gray.700");
    const triangleBgColorToken = useToken("colors", triangleBgColor);
    const narrowView = useIsNarrowView();
    const veryNarrowView = useIsVeryNarrowView();

    const navState = useNavigationState();

    useEffect(() => {
        if (narrowView && isExpanded) {
            liveNow_OnClose();
        }
    }, [liveNow_OnClose, narrowView, isExpanded]);

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
                <LiveNow isMenuExpanded={isExpanded} />
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
                            ref={liveNowButtonRef as React.RefObject<HTMLButtonElement>}
                            onClick={() => {
                                if (liveNow_IsOpen && !narrowView) {
                                    liveNow_OnClose();
                                } else {
                                    liveNow_OnOpen();
                                }
                                if (narrowView) {
                                    setIsExpanded(false);
                                }
                            }}
                            mb={1}
                            showLabel={isExpanded}
                            isDisabled={navState.disabled}
                        >
                            {liveNow_IsOpen ? (
                                <Box pos="absolute" top={0} right={0} h="100%">
                                    <svg width="7" height="100%" viewBox="0 0 7 10">
                                        <polygon points="0,5 8,0 8,10" fill={triangleBgColorToken} />
                                    </svg>
                                </Box>
                            ) : (
                                <Box pos="absolute" top={1} right={1} fontSize="xs">
                                    {liveRoomCount}
                                </Box>
                            )}
                        </MenuButton>
                    ) : undefined}
                    <MenuButton
                        label="Schedule"
                        iconStyle="s"
                        icon={"calendar"}
                        px={0}
                        borderRadius={0}
                        colorScheme={colorScheme}
                        ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                        onClick={!narrowView ? () => schedule_OnOpen(undefined, ProgramModalTab.Schedule) : undefined}
                        as={narrowView ? ReactLink : undefined}
                        to={narrowView ? `${conferencePath}/schedule` : undefined}
                        mb={1}
                        showLabel={isExpanded}
                        isDisabled={navState.disabled}
                    />
                    <MenuButton
                        label="Exhibitions"
                        iconStyle="s"
                        icon={"puzzle-piece"}
                        px={0}
                        borderRadius={0}
                        colorScheme={colorScheme}
                        ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                        onClick={
                            !narrowView ? () => schedule_OnOpen(undefined, ProgramModalTab.Exhibitions) : undefined
                        }
                        as={narrowView ? ReactLink : undefined}
                        to={narrowView ? `${conferencePath}/exhibitions` : undefined}
                        mb={1}
                        showLabel={isExpanded}
                        isDisabled={navState.disabled}
                    />
                    {conference.forceSponsorsMenuLink?.[0]?.value || narrowView ? (
                        <MenuButton
                            label={conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
                            iconStyle="s"
                            icon={"star"}
                            px={0}
                            borderRadius={0}
                            colorScheme={colorScheme}
                            onClick={
                                !narrowView ? () => schedule_OnOpen(undefined, ProgramModalTab.Sponsors) : undefined
                            }
                            as={narrowView ? ReactLink : undefined}
                            to={narrowView ? `${conferencePath}/sponsors` : undefined}
                            mb={1}
                            showLabel={isExpanded}
                            isDisabled={navState.disabled}
                        />
                    ) : undefined}
                    {maybeRegistrant ? (
                        <>
                            <MenuButton
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
                                ref={socialiseButtonRef as React.RefObject<HTMLButtonElement>}
                                onClick={!narrowView ? () => socialise_OnOpen() : undefined}
                                as={narrowView ? ReactLink : undefined}
                                to={narrowView ? `${conferencePath}/socialise` : undefined}
                                mb={1}
                                showLabel={isExpanded}
                                isDisabled={navState.disabled}
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
                                    as={navState.disabled ? undefined : ReactLink}
                                    to={`${conferencePath}/swag`}
                                    mb={1}
                                    showLabel={isExpanded}
                                    isDisabled={navState.disabled}
                                />
                            ) : undefined}
                        </>
                    ) : undefined}
                    {veryNarrowView ? (
                        <MenuButton
                            label="Search"
                            iconStyle="s"
                            icon={"search"}
                            px={0}
                            borderRadius={0}
                            colorScheme={colorScheme}
                            ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                            as={ReactLink}
                            to={`${conferencePath}/search`}
                            mb={1}
                            showLabel={isExpanded}
                            isDisabled={navState.disabled}
                        />
                    ) : undefined}
                    <Box flex="1 1 auto" />
                    <RequireRole organizerRole moderatorRole>
                        <MenuButton
                            label="Manage"
                            iconStyle="s"
                            icon="cog"
                            borderRadius={0}
                            colorScheme={colorScheme}
                            as={navState.disabled ? undefined : ReactLink}
                            to={`${conferencePath}/manage`}
                            mb={1}
                            showLabel={isExpanded}
                            isDisabled={navState.disabled}
                        />
                    </RequireRole>
                    <MenuButton
                        label="Feedback"
                        iconStyle="s"
                        icon="comment-medical"
                        borderTopRadius={0}
                        colorScheme={colorScheme}
                        as={navState.disabled ? undefined : Link}
                        href="https://form.asana.com?k=TOpJbWqoZ36fWafSStJ9dQ&d=1198973227684402"
                        showLabel={isExpanded}
                        textDecoration="none"
                        isDisabled={navState.disabled}
                    />
                </Flex>
            </Flex>
        </>
    );
}
