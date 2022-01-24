import { gql } from "@apollo/client";
import { Box, Flex, Link, MenuDivider, MenuItem, Text } from "@chakra-ui/react";
import * as R from "ramda";
import React, { Fragment, useEffect } from "react";
import { Link as ReactLink, useHistory, useLocation } from "react-router-dom";
import { Permissions_Permission_Enum, useCountSwagBagsQuery } from "../../../generated/graphql";
import LogoutButton from "../../Auth/Buttons/LogoutButton";
import { useMyBackstagesModal } from "../../Conference/Attend/Profile/MyBackstages";
import { useLiveProgramRoomsModal } from "../../Conference/Attend/Rooms/V2/LiveProgramRoomsModal";
import { useSocialiseModal } from "../../Conference/Attend/Rooms/V2/SocialiseModal";
import { ProgramModalTab, useScheduleModal } from "../../Conference/Attend/Schedule/ProgramModal";
import { useStarredEventsModal } from "../../Conference/Attend/Schedule/StarredEventsModal";
import RequireAtLeastOnePermissionWrapper from "../../Conference/RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import { useRestorableState } from "../../Generic/useRestorableState";
import FAIcon from "../../Icons/FAIcon";
import { useLiveEvents } from "../../LiveEvents/LiveEvents";
import useRoomParticipants from "../../Room/useRoomParticipants";
import useMaybeCurrentUser from "../../Users/CurrentUser/useMaybeCurrentUser";
import MenuButton from "./MenuButton";
import MoreOptionsMenuButton from "./MoreOptionsMenuButton";
import { FormattedMessage, useIntl } from "react-intl";

gql`
    query CountSwagBags($conferenceId: uuid!) {
        content_Item_aggregate(where: { conferenceId: { _eq: $conferenceId }, typeName: { _eq: SWAG_BAG } }) {
            aggregate {
                count
            }
        }
    }
`;

export default function LeftMenu(): JSX.Element {
    const intl = useIntl();
    const conference = useConference();
    const maybeUser = useMaybeCurrentUser()?.user;
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const history = useHistory();
    const colorScheme = "LeftMenuButton";

    const swagBagsResponse = useCountSwagBagsQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "cache-first",
        skip: !maybeUser,
    });

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

    const [isExpanded, setIsExpanded] = useRestorableState<boolean>(
        "LeftMenu_IsExpanded",
        true,
        (x) => x.toString(),
        (x) => x === "true"
    );
    return (
        <>
            <Flex flexDir="column" justifyContent="center" alignItems="flex-start" h="100%" bgColor="LeftMenu.600">
                <MenuButton
                    label={isExpanded ? intl.formatMessage({ id: 'menu.v2.leftmenu.collapse', defaultMessage: "Collapse menu" }) : intl.formatMessage({ id: 'menu.v2.leftmenu.expand', defaultMessage: "Expand menu" })}
                    iconStyle="s"
                    icon={isExpanded ? ["arrow-left", "grip-lines-vertical"] : ["grip-lines-vertical", "arrow-right"]}
                    borderTopRadius={0}
                    colorScheme={colorScheme}
                    side="right"
                    mb={1}
                    showLabel={false}
                    onClick={() => setIsExpanded(!isExpanded)}
                    fontSize="xs"
                    justifyContent="center"
                    w="auto"
                    minW="auto"
                    alignSelf="flex-end"
                    minH={0}
                    h="auto"
                    lineHeight={0}
                    m={1.5}
                />
                <MenuButton
                    label={intl.formatMessage({ id: 'menu.v2.leftmenu.collapse', defaultMessage: "Collapse menu" })}
                    iconStyle="s"
                    icon="home"
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    onClick={() => {
                        history.push(`/conference/${conference.slug}`);
                    }}
                    mb={1}
                    showLabel={isExpanded}
                />
                {showLive ? (
                    <MenuButton
                        label={intl.formatMessage({ id: 'menu.v2.leftmenu.livenow', defaultMessage: "Live now" })}
                        iconStyle="s"
                        icon="podcast"
                        borderBottomRadius={0}
                        colorScheme="LiveActionButton"
                        side="left"
                        ref={liveNowButtonRef as React.RefObject<HTMLButtonElement>}
                        onClick={liveNow_OnOpen}
                        mb={1}
                        showLabel={isExpanded}
                    >
                        <Box pos="absolute" top={1} right={1} fontSize="xs">
                            {liveRoomCount}
                        </Box>
                    </MenuButton>
                ) : undefined}
                <MenuButton
                    label={intl.formatMessage({ id: 'menu.v2.leftmenu.program', defaultMessage: "Program" })}
                    iconStyle="s"
                    icon={"calendar"}
                    px={0}
                    borderRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    ref={scheduleButtonRef as React.RefObject<HTMLButtonElement>}
                    onClick={() => schedule_OnOpen()}
                    mb={conference.forceSponsorsMenuLink?.[0]?.value || maybeRegistrant ? 1 : "auto"}
                    showLabel={isExpanded}
                />
                {conference.forceSponsorsMenuLink?.[0]?.value ? (
                    <MenuButton
                        label={conference.sponsorsLabel?.[0]?.value ?? intl.formatMessage({ id: 'menu.v2.leftmenu.sponsors', defaultMessage: "Sponsors" })}
                        iconStyle="s"
                        icon={"star"}
                        px={0}
                        borderRadius={0}
                        colorScheme={colorScheme}
                        side="left"
                        onClick={() => schedule_OnOpen(undefined, ProgramModalTab.Sponsors)}
                        mb={maybeRegistrant ? 1 : "auto"}
                        showLabel={isExpanded}
                    />
                ) : undefined}
                {maybeRegistrant ? (
                    <>
                        <MenuButton
                            label={intl.formatMessage({ id: 'menu.v2.leftmenu.socialise', defaultMessage: "Socialise" })}
                            ariaLabel={
                                roomParticipants !== undefined &&
                                roomParticipants !== false &&
                                roomParticipants.length > 0
                                    ? `Socialise: ${roomParticipants.length} ${
                                          roomParticipants.length === 1 ? "person" : "people"
                                      } connected`
                                    : intl.formatMessage({ id: 'menu.v2.leftmenu.socialise', defaultMessage: "Socialise" })
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
                            label={intl.formatMessage({ id: 'menu.v2.leftmenu.mystuff', defaultMessage: "My stuff" })}
                            iconStyle="s"
                            icon="user"
                            borderRadius={0}
                            colorScheme={colorScheme}
                            side="left"
                            mb="auto"
                            showLabel={isExpanded}
                            imageSrc={maybeRegistrant.profile?.photoURL_50x50 ?? undefined}
                        >
                            <Text px={2} fontSize="sm" fontWeight="bold">
                                {maybeRegistrant.displayName}
                            </Text>
                            {maybeUser ? (
                                <Text py={1} px={2} fontSize="sm" fontFamily="monospace">
                                    {maybeUser?.email}
                                </Text>
                            ) : undefined}
                            <MenuItem
                                ref={myStarredEventsButtonRef as React.RefObject<HTMLButtonElement>}
                                onClick={myStarredEvents_OnOpen}
                            >
                                <FAIcon iconStyle="s" icon="star" mr={2} aria-hidden={true} w="1.2em" />
                                <FormattedMessage
                                    id="menu.v2.leftmenu.myevents"
                                    defaultMessage="My events"
                                />
                            </MenuItem>
                            <MenuItem as={ReactLink} to={`/conference/${conference.slug}/profile`}>
                                <FAIcon iconStyle="s" icon="user" mr={2} aria-hidden={true} w="1.2em" />
                                <FormattedMessage
                                    id="menu.v2.leftmenu.myprofile"
                                    defaultMessage="My profile"
                                />
                            </MenuItem>
                            <MenuItem as={ReactLink} to={`/conference/${conference.slug}/recordings`}>
                                <FAIcon iconStyle="s" icon="play" mr={2} aria-hidden={true} w="1.2em" />
                                <FormattedMessage
                                    id="menu.v2.leftmenu.myrecordings"
                                    defaultMessage="My recordings"
                                />
                            </MenuItem>
                            {swagBagsResponse.data?.content_Item_aggregate.aggregate?.count ? (
                                <MenuItem as={ReactLink} to={`/conference/${conference.slug}/swag`}>
                                    <FAIcon iconStyle="s" icon="gift" mr={2} aria-hidden={true} w="1.2em" />
                                    <FormattedMessage
                                        id="menu.v2.leftmenu.myconferenceswag"
                                        defaultMessage="My conference swag"
                                    />
                                </MenuItem>
                            ) : undefined}
                            <MenuItem
                                ref={myBackstagesButtonRef as React.RefObject<HTMLButtonElement>}
                                onClick={myBackstages_OnOpen}
                            >
                                <FAIcon iconStyle="s" icon="person-booth" mr={2} aria-hidden={true} w="1.2em" />
                                <FormattedMessage
                                    id="menu.v2.leftmenu.mybackstages"
                                    defaultMessage="My backstages"
                                />
                            </MenuItem>
                            <LogoutButton asMenuItem showLabel={isExpanded} />
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
                        showLabel={isExpanded}
                    >
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/checklist`}>
                            <FAIcon iconStyle="s" icon="check" mr={2} aria-hidden={true} w="1.2em" />
                            <FormattedMessage
                                id="menu.v2.leftmenu.checklist"
                                defaultMessage="Checklist"
                            />
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage`}>
                            <FAIcon iconStyle="s" icon="cog" mr={2} aria-hidden={true} w="1.2em" />
                            <FormattedMessage
                                id="menu.v2.leftmenu.dashboard"
                                defaultMessage="Dashboard"
                            />
                        </MenuItem>
                        <MenuDivider />
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/content`}>
                            <FAIcon iconStyle="s" icon="align-left" mr={2} aria-hidden={true} w="1.2em" />
                            <FormattedMessage
                                id="menu.v2.leftmenu.content"
                                defaultMessage="Content"
                            />
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/schedule`}>
                            <FAIcon iconStyle="s" icon="calendar" mr={2} aria-hidden={true} w="1.2em" />
                            <FormattedMessage
                                id="menu.v2.leftmenu.schedule"
                                defaultMessage="Schedule"
                            />
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/rooms`}>
                            <FAIcon iconStyle="s" icon="coffee" mr={2} aria-hidden={true} w="1.2em" />
                            <FormattedMessage
                                id="menu.v2.leftmenu.rooms"
                                defaultMessage="Rooms"
                            />
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/people`}>
                            <FAIcon iconStyle="s" icon="people-arrows" mr={2} aria-hidden={true} w="1.2em" />
                            <FormattedMessage
                                id="menu.v2.leftmenu.programpeople"
                                defaultMessage="Program People"
                            />
                        </MenuItem>
                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage/registrants`}>
                            <FAIcon iconStyle="s" icon="users" mr={2} aria-hidden={true} w="1.2em" />
                            <FormattedMessage
                                id="menu.v2.leftmenu.registrants"
                                defaultMessage="Registrants"
                            />
                        </MenuItem>
                    </MoreOptionsMenuButton>
                </RequireAtLeastOnePermissionWrapper>
                {maybeUser ? (
                    <MoreOptionsMenuButton
                        label={intl.formatMessage({ id: 'menu.v2.leftmenu.conferences', defaultMessage: "Conferences" })}
                        iconStyle="s"
                        icon="ticket-alt"
                        borderRadius={0}
                        colorScheme={colorScheme}
                        side="left"
                        mb={1}
                        showLabel={isExpanded}
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
                        {!conference || maybeUser.registrants.length > 1 ? <MenuDivider /> : undefined}
                        <MenuItem as={ReactLink} to="/join">
                            <FAIcon iconStyle="s" icon="ticket-alt" />
                            &nbsp;&nbsp;
                            <FormattedMessage
                                id="menu.v2.leftmenu.useinvitecode"
                                defaultMessage="Use invite code"
                            />
                        </MenuItem>
                    </MoreOptionsMenuButton>
                ) : undefined}
                <MenuButton
                    label={intl.formatMessage({ id: 'menu.v2.leftmenu.feedback', defaultMessage: "Feedback" })}
                    iconStyle="s"
                    icon="comment-medical"
                    borderTopRadius={0}
                    colorScheme={colorScheme}
                    side="left"
                    as={Link}
                    href="https://form.asana.com?k=TOpJbWqoZ36fWafSStJ9dQ&d=1198973227684402"
                    showLabel={isExpanded}
                    textDecoration="none"
                />
            </Flex>
        </>
    );
}
