import { Box, Flex, Link, MenuDivider, MenuItem, Text, useBreakpointValue, useDisclosure } from "@chakra-ui/react";
import * as R from "ramda";
import React, { Fragment, useEffect, useRef } from "react";
import { Link as ReactLink, useHistory, useLocation } from "react-router-dom";
import { Permissions_Permission_Enum } from "../../../generated/graphql";
import { ExhibitionsModal } from "../../Conference/Attend/Exhibition/ExhibitionsPage";
import LiveProgramRoomsModal from "../../Conference/Attend/Rooms/V2/LiveProgramRoomsModal";
import SocialiseModal from "../../Conference/Attend/Rooms/V2/SocialiseModal";
import SponsorBoothsModal from "../../Conference/Attend/Rooms/V2/SponsorBoothsModal";
import { ScheduleModal } from "../../Conference/Attend/Schedule/ProgramModal";
import RequireAtLeastOnePermissionWrapper from "../../Conference/RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../Conference/useConference";
import FAIcon from "../../Icons/FAIcon";
import { useLiveEvents } from "../../LiveEvents/LiveEvents";
import useRoomParticipants from "../../Room/useRoomParticipants";
import useCurrentUser from "../../Users/CurrentUser/useCurrentUser";
import MenuButton from "./MenuButton";
import MoreOptionsMenuButton from "./MoreOptionsMenuButton";

const colorScheme = "blue";
export default function LeftMenu(): JSX.Element {
    const conference = useConference();
    const user = useCurrentUser().user;
    const history = useHistory();

    const { liveEventsByRoom } = useLiveEvents();

    const location = useLocation();

    const { isOpen: liveNow_IsOpen, onOpen: liveNow_OnOpen, onClose: liveNow_OnClose } = useDisclosure();
    const liveNowButtonRef = useRef<HTMLButtonElement | null>(null);

    const { isOpen: exhibitions_IsOpen, onOpen: exhibitions_OnOpen, onClose: exhibitions_OnClose } = useDisclosure();
    const exhibitionsButtonRef = useRef<HTMLButtonElement | null>(null);

    const { isOpen: schedule_IsOpen, onOpen: schedule_OnOpen, onClose: schedule_OnClose } = useDisclosure();
    const scheduleButtonRef = useRef<HTMLButtonElement | null>(null);

    const { isOpen: socialise_IsOpen, onOpen: socialise_OnOpen, onClose: socialise_OnClose } = useDisclosure();
    const socialiseButtonRef = useRef<HTMLButtonElement | null>(null);

    const {
        isOpen: sponsorBooths_IsOpen,
        onOpen: sponsorBooths_OnOpen,
        onClose: sponsorBooths_OnClose,
    } = useDisclosure();
    const sponsorBoothsButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        liveNow_OnClose();
        exhibitions_OnClose();
        schedule_OnClose();
        socialise_OnClose();
        sponsorBooths_OnClose();
    }, [
        location.pathname,
        liveNow_OnClose,
        exhibitions_OnClose,
        schedule_OnClose,
        socialise_OnClose,
        sponsorBooths_OnClose,
    ]);

    const roomParticipants = useRoomParticipants();

    const liveRoomCount = Object.keys(liveEventsByRoom).length;
    const showLive = liveRoomCount > 0;

    const barWidth = useBreakpointValue({
        base: "3em",
        lg: "4em",
    });

    return (
        <>
            <Flex flexDir="column" w={barWidth} justifyContent="center" alignItems="flex-start">
                <Text fontSize="xs" textAlign="left" ml={1} mb={2}>
                    Navigate
                </Text>
                {showLive ? (
                    <MenuButton
                        label={`Live now: ${liveRoomCount} rooms`}
                        iconStyle="s"
                        icon="podcast"
                        borderBottomRadius={0}
                        colorScheme="red"
                        side="left"
                        ref={liveNowButtonRef}
                        onClick={liveNow_OnOpen}
                    >
                        <Box pos="absolute" top={1} right={1} fontSize="xs">
                            {liveRoomCount}
                        </Box>
                    </MenuButton>
                ) : undefined}
                <MenuButton
                    label="Sponsors"
                    iconStyle="s"
                    icon="star"
                    borderTopRadius={showLive ? 0 : undefined}
                    borderBottomRadius={0}
                    colorScheme={colorScheme}
                    bgColor="gold"
                    side="left"
                    ref={sponsorBoothsButtonRef}
                    onClick={sponsorBooths_OnOpen}
                />
                <MenuButton
                    label={
                        roomParticipants !== undefined && roomParticipants !== false && roomParticipants.length > 0
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
                    ref={socialiseButtonRef}
                    onClick={socialise_OnOpen}
                >
                    {roomParticipants !== undefined && roomParticipants !== false && roomParticipants.length > 0 ? (
                        <Box pos="absolute" top={1} right={1} fontSize="xs">
                            {roomParticipants.length}
                        </Box>
                    ) : undefined}
                </MenuButton>
                <MenuButton
                    label="Explore program"
                    iconStyle="s"
                    icon={["calendar", "search"]}
                    px={0}
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    ref={scheduleButtonRef}
                    onClick={schedule_OnOpen}
                />
                <MenuButton
                    label="Exhibitions"
                    iconStyle="s"
                    icon="puzzle-piece"
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    ref={exhibitionsButtonRef}
                    onClick={exhibitions_OnOpen}
                />
                <MenuButton
                    label="Conference home"
                    iconStyle="s"
                    icon="home"
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    onClick={() => {
                        history.push(`/conference/${conference.slug}`);
                    }}
                />
                <RequireAtLeastOnePermissionWrapper
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageAttendees,
                        Permissions_Permission_Enum.ConferenceManageContent,
                        Permissions_Permission_Enum.ConferenceManageGroups,
                        Permissions_Permission_Enum.ConferenceManageName,
                        Permissions_Permission_Enum.ConferenceManageRoles,
                        Permissions_Permission_Enum.ConferenceManageSchedule,
                        Permissions_Permission_Enum.ConferenceManageShuffle,
                        Permissions_Permission_Enum.ConferenceModerateAttendees,
                    ]}
                >
                    <MoreOptionsMenuButton
                        label="Manage conference"
                        iconStyle="s"
                        icon="cog"
                        borderRadius={0}
                        colorScheme="gray"
                        side="left"
                    >
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/checklist`}>
                            <FAIcon iconStyle="s" icon="check" mr={2} aria-hidden={true} w="1.2em" />
                            Checklist
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage`}>
                            <FAIcon iconStyle="s" icon="cog" mr={2} aria-hidden={true} w="1.2em" />
                            Dashboard
                        </MenuItem>
                        <MenuDivider />
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/content/v2`}>
                            <FAIcon iconStyle="s" icon="align-left" mr={2} aria-hidden={true} w="1.2em" />
                            Content
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/schedule`}>
                            <FAIcon iconStyle="s" icon="calendar" mr={2} aria-hidden={true} w="1.2em" />
                            Schedule
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/rooms`}>
                            <FAIcon iconStyle="s" icon="coffee" mr={2} aria-hidden={true} w="1.2em" />
                            Rooms
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/people`}>
                            <FAIcon iconStyle="s" icon="people-arrows" mr={2} aria-hidden={true} w="1.2em" />
                            Program People
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/registrants`}>
                            <FAIcon iconStyle="s" icon="users" mr={2} aria-hidden={true} w="1.2em" />
                            Registrants
                        </MenuItem>
                    </MoreOptionsMenuButton>
                </RequireAtLeastOnePermissionWrapper>
                <MoreOptionsMenuButton
                    label="My conferences"
                    iconStyle="s"
                    icon="ticket-alt"
                    borderRadius={0}
                    colorScheme="gray"
                    side="left"
                >
                    {R.sortBy((registrant) => registrant.conference.shortName, user.registrants).map((registrant) =>
                        registrant.conferenceId === conference.id ? (
                            <Fragment key={registrant.conferenceId} />
                        ) : (
                            <MenuItem
                                key={registrant.conferenceId}
                                as={ReactLink}
                                to={`/conference/${registrant.conference.slug}`}
                            >
                                <FAIcon iconStyle="s" icon="link" />
                                &nbsp;&nbsp;
                                {registrant.conference.shortName}
                            </MenuItem>
                        )
                    )}
                </MoreOptionsMenuButton>
                <MenuButton
                    label="Feedback"
                    iconStyle="s"
                    icon="comment-medical"
                    borderTopRadius={0}
                    colorScheme="gray"
                    side="left"
                    as={Link}
                    href="https://github.com/clowdr-app/clowdr/issues"
                />
            </Flex>
            <LiveProgramRoomsModal isOpen={liveNow_IsOpen} onClose={liveNow_OnClose} finalFocusRef={liveNowButtonRef} />
            <ExhibitionsModal
                isOpen={exhibitions_IsOpen}
                onClose={exhibitions_OnClose}
                finalFocusRef={exhibitionsButtonRef}
            />
            <ScheduleModal isOpen={schedule_IsOpen} onClose={schedule_OnClose} finalFocusRef={scheduleButtonRef} />
            <SocialiseModal isOpen={socialise_IsOpen} onClose={socialise_OnClose} finalFocusRef={socialiseButtonRef} />
            <SponsorBoothsModal
                isOpen={sponsorBooths_IsOpen}
                onClose={sponsorBooths_OnClose}
                finalFocusRef={sponsorBoothsButtonRef}
            />
        </>
    );
}
