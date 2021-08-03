import { Box, Flex, Link, MenuDivider, MenuItem, useBreakpointValue } from "@chakra-ui/react";
import * as R from "ramda";
import React, { Fragment, useEffect } from "react";
import { Link as ReactLink, useHistory, useLocation } from "react-router-dom";
import { Permissions_Permission_Enum } from "../../../generated/graphql";
import { useMyBackstagesModal } from "../../Conference/Attend/Profile/MyBackstages";
import { useLiveProgramRoomsModal } from "../../Conference/Attend/Rooms/V2/LiveProgramRoomsModal";
import { useSocialiseModal } from "../../Conference/Attend/Rooms/V2/SocialiseModal";
import { useScheduleModal } from "../../Conference/Attend/Schedule/ProgramModal";
import { useStarredEventsModal } from "../../Conference/Attend/Schedule/StarredEventsModal";
import RequireAtLeastOnePermissionWrapper from "../../Conference/RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import FAIcon from "../../Icons/FAIcon";
import { useLiveEvents } from "../../LiveEvents/LiveEvents";
import useRoomParticipants from "../../Room/useRoomParticipants";
import useMaybeCurrentUser from "../../Users/CurrentUser/useMaybeCurrentUser";
import MenuButton from "./MenuButton";
import MoreOptionsMenuButton from "./MoreOptionsMenuButton";

const colorScheme = "blue";
export default function LeftMenu(): JSX.Element {
    const conference = useConference();
    const maybeUser = useMaybeCurrentUser()?.user;
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const history = useHistory();

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
    const {
        onOpen: myBackstages_OnOpen,
        onClose: myBackstages_OnClose,
        finalFocusRef: myBackstagesButtonRef,
    } = useMyBackstagesModal();
    const {
        onOpen: myStarredEvents_OnOpen,
        onClose: myStarredEvents_OnClose,
        finalFocusRef: myStarredEventsButtonRef,
    } = useStarredEventsModal();

    useEffect(() => {
        liveNow_OnClose();
        schedule_OnClose();
        socialise_OnClose();
        myBackstages_OnClose();
        myStarredEvents_OnClose();
    }, [
        location.pathname,
        liveNow_OnClose,
        schedule_OnClose,
        socialise_OnClose,
        myBackstages_OnClose,
        myStarredEvents_OnClose,
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
            <Flex
                flexDir="column"
                justifyContent="center"
                alignItems="flex-start"
                minW={barWidth}
                h="100%"
                bgColor="blue.600"
            >
                <MenuButton
                    label="Home"
                    iconStyle="s"
                    icon="home"
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    onClick={() => {
                        history.push(`/conference/${conference.slug}`);
                    }}
                    mt="auto"
                    mb={1}
                />
                {showLive ? (
                    <MenuButton
                        label="Live now"
                        iconStyle="s"
                        icon="podcast"
                        borderBottomRadius={0}
                        colorScheme="red"
                        side="left"
                        ref={liveNowButtonRef as React.RefObject<HTMLButtonElement>}
                        onClick={liveNow_OnOpen}
                        mb={1}
                    >
                        <Box pos="absolute" top={1} right={1} fontSize="xs">
                            {liveRoomCount}
                        </Box>
                    </MenuButton>
                ) : undefined}
                <MenuButton
                    label="Program"
                    iconStyle="s"
                    icon={"calendar"}
                    px={0}
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                    onClick={() => schedule_OnOpen()}
                    mb={maybeRegistrant ? 1 : "auto"}
                />
                {maybeRegistrant ? (
                    <>
                        <MenuButton
                            label={
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
                        >
                            {roomParticipants !== undefined &&
                            roomParticipants !== false &&
                            roomParticipants.length > 0 ? (
                                <Box pos="absolute" top={1} right={1} fontSize="xs">
                                    {roomParticipants.length}
                                </Box>
                            ) : undefined}
                        </MenuButton>
                        <MoreOptionsMenuButton
                            label="My stuff"
                            iconStyle="s"
                            icon="user"
                            borderRadius={0}
                            colorScheme={colorScheme}
                            side="left"
                            mb="auto"
                        >
                            <MenuItem
                                ref={myStarredEventsButtonRef as React.RefObject<HTMLButtonElement>}
                                onClick={myStarredEvents_OnOpen}
                            >
                                <FAIcon iconStyle="s" icon="star" mr={2} aria-hidden={true} w="1.2em" />
                                My events
                            </MenuItem>
                            <MenuItem as={ReactLink} to={`/conference/${conference.slug}/profile`}>
                                <FAIcon iconStyle="s" icon="user" mr={2} aria-hidden={true} w="1.2em" />
                                My profile
                            </MenuItem>
                            <MenuItem
                                ref={myBackstagesButtonRef as React.RefObject<HTMLButtonElement>}
                                onClick={myBackstages_OnOpen}
                            >
                                <FAIcon iconStyle="s" icon="person-booth" mr={2} aria-hidden={true} w="1.2em" /> My
                                backstages
                            </MenuItem>
                        </MoreOptionsMenuButton>
                    </>
                ) : undefined}
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
                        label="Manage"
                        iconStyle="s"
                        icon="cog"
                        borderRadius={0}
                        colorScheme={colorScheme}
                        side="left"
                        mb={1}
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
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/content`}>
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
                {maybeUser ? (
                    <MoreOptionsMenuButton
                        label="Conferences"
                        iconStyle="s"
                        icon="ticket-alt"
                        borderRadius={0}
                        colorScheme={colorScheme}
                        side="left"
                        mb={1}
                    >
                        {R.sortBy((registrant) => registrant.conference.shortName, maybeUser.registrants).map(
                            (registrant) =>
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
                        {maybeUser.registrants.length ? <MenuDivider /> : undefined}
                        <MenuItem as={ReactLink} to="/join">
                            <FAIcon iconStyle="s" icon="ticket-alt" />
                            &nbsp;&nbsp; Use invite code
                        </MenuItem>
                    </MoreOptionsMenuButton>
                ) : undefined}
                <MenuButton
                    label="Feedback"
                    iconStyle="s"
                    icon="comment-medical"
                    borderTopRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    as={Link}
                    href="https://github.com/clowdr-app/clowdr/issues"
                />
            </Flex>
        </>
    );
}
