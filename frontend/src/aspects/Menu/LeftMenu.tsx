import { Box, Flex, Link, useColorModeValue } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useEffect } from "react";
import { Link as ReactLink, useHistory, useLocation } from "react-router-dom";
import { useCountSwagBagsQuery } from "../../generated/graphql";
import { useLiveProgramRoomsModal } from "../Conference/Attend/Rooms/V2/LiveProgramRoomsModal";
import { useSocialiseModal } from "../Conference/Attend/Rooms/V2/SocialiseModalProvider";
import { ProgramModalTab, useScheduleModal } from "../Conference/Attend/Schedule/ProgramModal";
import RequireRole from "../Conference/RequireRole";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { useAuthParameters } from "../GQL/AuthParameters";
import useIsNarrowView from "../Hooks/useIsNarrowView";
import useIsVeryNarrowView from "../Hooks/useIsVeryNarrowView";
import { useLiveEvents } from "../LiveEvents/LiveEvents";
import useRoomParticipants from "../Room/useRoomParticipants";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import MenuButton from "./MenuButton";
import { useNavigationState } from "./NavigationState";

gql`
    query CountSwagBags($conferenceId: uuid!) {
        content_Item_aggregate(where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: SWAG_BAG } }) {
            aggregate {
                count
            }
        }
    }
`;

export default function LeftMenu({ isExpanded }: { isExpanded: boolean }): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const maybeUser = useMaybeCurrentUser()?.user;
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const history = useHistory();
    const colorScheme = "LeftMenuButton";

    const [swagBagsResponse] = useCountSwagBagsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pause: !maybeUser,
    });
    const hasSwagBags = Boolean(swagBagsResponse.data?.content_Item_aggregate.aggregate?.count);

    const { liveEventsByRoom } = useLiveEvents();

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
    } = useLiveProgramRoomsModal();

    useEffect(() => {
        liveNow_OnClose();
        schedule_OnClose();
        socialise_OnClose();
    }, [location.pathname, liveNow_OnClose, schedule_OnClose, socialise_OnClose]);

    const roomParticipants = useRoomParticipants();

    const liveRoomCount = Object.keys(liveEventsByRoom).length;
    const showLive = liveRoomCount > 0;

    const bgColor = useColorModeValue("LeftMenu.500", "LeftMenu.200");
    const narrowView = useIsNarrowView();
    const veryNarrowView = useIsVeryNarrowView();

    const navState = useNavigationState();

    return (
        <>
            <Flex
                pos={narrowView ? "absolute" : undefined}
                w={isExpanded ? (narrowView ? "100%" : "9rem") : narrowView ? "0" : "3rem"}
                h={narrowView ? "calc(100% - 6ex - 6px)" : "100%"}
                top={narrowView ? "calc(6ex + 6px)" : undefined}
                left={narrowView ? 0 : undefined}
                zIndex={3}
                flexDir="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                bgColor={bgColor}
                flex="0 0 auto"
                overflow="hidden"
                transition="width 0.15s cubic-bezier(0.33, 1, 0.68, 1)"
            >
                {showLive ? (
                    <MenuButton
                        label="Live now"
                        iconStyle="s"
                        icon="podcast"
                        borderBottomRadius={0}
                        colorScheme="LiveActionButton"
                        side="left"
                        ref={liveNowButtonRef as React.RefObject<HTMLButtonElement>}
                        onClick={liveNow_OnOpen}
                        mb={1}
                        showLabel={isExpanded}
                        isDisabled={navState.disabled}
                    >
                        <Box pos="absolute" top={1} right={1} fontSize="xs">
                            {liveRoomCount}
                        </Box>
                    </MenuButton>
                ) : undefined}
                <MenuButton
                    label="Schedule"
                    iconStyle="s"
                    icon={"calendar"}
                    px={0}
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                    onClick={() => schedule_OnOpen(undefined, ProgramModalTab.Exhibitions)}
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
                    side="left"
                    ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                    onClick={() => schedule_OnOpen(undefined, ProgramModalTab.Exhibitions)}
                    mb={1}
                    showLabel={isExpanded}
                    isDisabled={navState.disabled}
                />
                {conference.forceSponsorsMenuLink?.[0]?.value ? (
                    <MenuButton
                        label={conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
                        iconStyle="s"
                        icon={"star"}
                        px={0}
                        borderRadius={0}
                        colorScheme={colorScheme}
                        side="left"
                        onClick={() => schedule_OnOpen(undefined, ProgramModalTab.Sponsors)}
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
                                roomParticipants !== undefined &&
                                roomParticipants !== false &&
                                roomParticipants.length > 0
                                    ? `Socialise: ${roomParticipants.length} ${
                                          roomParticipants.length === 1 ? "person" : "people"
                                      } connected`
                                    : "Socialise"
                            }
                            iconStyle="s"
                            icon="mug-hot"
                            borderRadius={0}
                            colorScheme={colorScheme}
                            side="left"
                            pos="relative"
                            ref={socialiseButtonRef as React.RefObject<HTMLButtonElement>}
                            onClick={() => socialise_OnOpen()}
                            mb={1}
                            showLabel={isExpanded}
                            isDisabled={navState.disabled}
                        >
                            {roomParticipants !== undefined &&
                            roomParticipants !== false &&
                            roomParticipants.length > 0 ? (
                                <Box pos="absolute" top={1} right={1} fontSize="xs">
                                    {roomParticipants.length}
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
                                side="left"
                                as={ReactLink}
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
                        side="left"
                        ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                        onClick={() => schedule_OnOpen(undefined, ProgramModalTab.Exhibitions)}
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
                        side="left"
                        onClick={() => {
                            if (conferencePath) {
                                history.push(`${conferencePath}/manage`);
                            }
                        }}
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
                    side="left"
                    as={Link}
                    href="https://form.asana.com?k=TOpJbWqoZ36fWafSStJ9dQ&d=1198973227684402"
                    showLabel={isExpanded}
                    textDecoration="none"
                    isDisabled={navState.disabled}
                />
            </Flex>
        </>
    );
}
