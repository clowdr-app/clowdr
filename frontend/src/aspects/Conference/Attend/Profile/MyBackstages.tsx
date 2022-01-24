import { gql } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    chakra,
    Heading,
    HStack,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import * as R from "ramda";
import React, { useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import type { MyBackstages_EventFragment } from "../../../../generated/graphql";
import { useRegistrantEventsWithBackstagesQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import { Markdown } from "../../../Text/Markdown";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";

gql`
    fragment MyBackstages_Event on schedule_Event {
        id
        conferenceId
        item {
            id
            title
        }
        endTime
        intendedRoomModeName
        name
        room {
            id
            name
        }
        startTime
    }

    query RegistrantEventsWithBackstages($registrantId: uuid!) {
        schedule_Event(
            where: {
                eventPeople: { person: { registrantId: { _eq: $registrantId } } }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
                room: {}
            }
        ) {
            ...MyBackstages_Event
        }
    }
`;

function MyBackstages(): JSX.Element {
    const intl = useIntl();
    const conference = useConference();
    const registrant = useCurrentRegistrant();

    const myBackstagesResponse = useRegistrantEventsWithBackstagesQuery({
        variables: {
            registrantId: registrant.id,
        },
        fetchPolicy: "network-only",
    });

    const now = useRealTime(30000);

    const eventsGroupedByDay = useMemo(
        () =>
            myBackstagesResponse.data?.schedule_Event &&
            R.groupBy<MyBackstages_EventFragment>(
                (x) => new Date(x.startTime).toLocaleDateString(),
                R.sortBy(
                    (x) => Date.parse(x.startTime),
                    myBackstagesResponse.data.schedule_Event.filter((x) => Date.parse(x.endTime) >= now)
                )
            ),
        [myBackstagesResponse.data?.schedule_Event, now]
    );
    const eventsTodayAndFuture = useMemo(
        () =>
            eventsGroupedByDay &&
            Object.values(eventsGroupedByDay).filter((group) => {
                const startAtDay = new Date(group[0].startTime);
                startAtDay.setHours(23);
                startAtDay.setMinutes(59);
                startAtDay.setSeconds(59);
                startAtDay.setMilliseconds(999);
                return startAtDay.getTime() >= now;
            }),
        [eventsGroupedByDay, now]
    );

    const liveNowBg = useColorModeValue(
        "MyBackstages.liveNowBackgroundColor-light",
        "MyBackstages.liveNowBackgroundColor-dark"
    );
    const availableNowBg = useColorModeValue(
        "MyBackstages.backstageAvailableBackgroundColor-light",
        "MyBackstages.backstageAvailableBackgroundColor-dark"
    );
    const availableSoon = useColorModeValue(
        "MyBackstages.availableSoonBackgroundColor-light",
        "MyBackstages.availableSoonBackgroundColor-dark"
    );
    const myBackstagesNotice = useMemo(
        () =>
            "myBackstagesNotice" in conference &&
            conference.myBackstagesNotice.length > 0 &&
            conference.myBackstagesNotice[0]?.value?.length
                ? conference.myBackstagesNotice[0].value
                : undefined,
        [conference]
    );
    return (
        <>
            {myBackstagesNotice ? <Markdown>{myBackstagesNotice}</Markdown> : undefined}
            <Text pb={2} pt={myBackstagesNotice ? 2 : undefined}>
                <FormattedMessage
                    id="Conference.Attend.Profile.MyBackstages.BelowIsTheList"
                    defaultMessage="If you are an author, chair or presenter, below is the list of your backstages for current and future
                    live-stream (not video-chat) events. You should join your backstage when it is available."
                />
            </Text>
            <Text pb={4}>
                <FormattedMessage
                    id="Conference.Attend.Profile.MyBackstages.OnlyAvaiableForLiveStream"
                    defaultMessage="Backstages are only available for live-stream events. If you are presenting at a video-chat event, you
                    can go directly to your room at the start time. You will not see any backstages in this list."
                />
            </Text>
            {myBackstagesResponse.loading && !eventsGroupedByDay ? (
                <CenteredSpinner spinnerProps={{ label: "Loading backstages" }} />
            ) : undefined}
            {eventsTodayAndFuture ? (
                <>
                    {eventsTodayAndFuture.length === 0 ? (
                        <Text fontWeight="bold">
                            <FormattedMessage
                                id="Conference.Attend.Profile.MyBackstages.NotAssignedLiveStream"
                                defaultMessage="You are not assigned to any future live-stream events. If you think this is a mistake,
                                please contact your conference organisers."
                            />
                        </Text>
                    ) : (
                        <>
                            <Text>
                                <FormattedMessage
                                    id="Conference.Attend.Profile.MyBackstages.AllTimesLocal"
                                    defaultMessage="All times/dates are shown in your local timezone."
                                />
                            </Text>
                            <Accordion allowToggle w="100%" reduceMotion defaultIndex={0}>
                                {eventsTodayAndFuture.reduce((elements, group) => {
                                    const startAtDay = new Date(group[0].startTime);
                                    return [
                                        ...elements,
                                        <AccordionItem key={group[0].startTime}>
                                            <AccordionButton>
                                                <HStack>
                                                    <AccordionIcon ml={0} pl={0} />
                                                    <Box>
                                                        {startAtDay.toLocaleString(undefined, {
                                                            day: "2-digit",
                                                            month: "short",
                                                            weekday: "long",
                                                        })}
                                                    </Box>
                                                </HStack>
                                            </AccordionButton>
                                            <AccordionPanel>
                                                <Table size="sm" colorScheme="MyBackstages">
                                                    <Thead>
                                                        <Tr>
                                                            <Th maxW="7em">
                                                                <FormattedMessage
                                                                    id="Conference.Attend.Profile.MyBackstages.YouAreNeeded"
                                                                    defaultMessage="You are needed"
                                                                />
                                                            </Th>
                                                            <Th maxW="9em">
                                                                <FormattedMessage
                                                                    id="Conference.Attend.Profile.MyBackstages.BackstageFrom"
                                                                    defaultMessage="Backstage from"
                                                                />
                                                            </Th>
                                                            <Th maxW="5em">
                                                                <FormattedMessage
                                                                    id="Conference.Attend.Profile.MyBackstages.EventStart"
                                                                    defaultMessage="Event start"
                                                                />
                                                            </Th>
                                                            <Th maxW="12em">
                                                                <FormattedMessage
                                                                    id="Conference.Attend.Profile.MyBackstages.EventName"
                                                                    defaultMessage="Event name"
                                                                />
                                                            </Th>
                                                            <Th maxW="25em">
                                                                <FormattedMessage
                                                                    id="Conference.Attend.Profile.MyBackstages.ContentItem"
                                                                    defaultMessage="Content item"
                                                                />
                                                            </Th>
                                                            <Th maxW="15em">
                                                                <FormattedMessage
                                                                    id="Conference.Attend.Profile.MyBackstages.WhereToFindBackstage"
                                                                    defaultMessage="Where to find your backstage"
                                                                />
                                                            </Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {group.map((x) => {
                                                            const startAt = new Date(x.startTime);
                                                            const endTime = Date.parse(x.endTime);
                                                            const backstageStartTime =
                                                                startAt.getTime() - 20 * 1000 * 60;
                                                            const isNow = backstageStartTime <= now && now <= endTime;
                                                            const isSoon =
                                                                backstageStartTime - 40 * 1000 * 60 <= now &&
                                                                now <= endTime;
                                                            const isLive = startAt.getTime() <= now && now <= endTime;
                                                            return (
                                                                <Tr
                                                                    key={x.id}
                                                                    backgroundColor={
                                                                        isLive
                                                                            ? liveNowBg
                                                                            : isNow
                                                                            ? availableNowBg
                                                                            : isSoon
                                                                            ? availableSoon
                                                                            : undefined
                                                                    }
                                                                >
                                                                    <Td maxW="10em">
                                                                        {isLive || isNow ? (
                                                                            <LinkButton
                                                                                to={`/conference/${conference.slug}/room/${x.room?.id}`}
                                                                                overflowWrap="normal"
                                                                                maxW="100%"
                                                                                height="auto"
                                                                                whiteSpace="normal"
                                                                                linkProps={{
                                                                                    maxW: "100%",
                                                                                }}
                                                                                textAlign="center"
                                                                                colorScheme={
                                                                                    isLive
                                                                                        ? "LiveActionButton"
                                                                                        : "PrimaryActionButton"
                                                                                }
                                                                                size="lg"
                                                                                p={2}
                                                                                flexDir="column"
                                                                            >
                                                                                <FAIcon
                                                                                    icon="video"
                                                                                    iconStyle="s"
                                                                                    fontSize="xs"
                                                                                    mr={2}
                                                                                />
                                                                                <chakra.span>
                                                                                    <FormattedMessage
                                                                                        id="Conference.Attend.Profile.MyBackstages.NowExc"
                                                                                        defaultMessage="Now!"
                                                                                    />
                                                                                </chakra.span>
                                                                                <chakra.span fontSize="xs" mt={2}>
                                                                                    <FormattedMessage
                                                                                        id="Conference.Attend.Profile.MyBackstages.GoToBackstage"
                                                                                        defaultMessage="(Click here to go to your backstage)"
                                                                                    />
                                                                                </chakra.span>
                                                                            </LinkButton>
                                                                        ) : isSoon ? (
                                                                            intl.formatMessage({ id: 'Conference.Attend.Profile.MyBackstages.Soon', defaultMessage: "Soon" })
                                                                        ) : (
                                                                            intl.formatMessage({ id: 'Conference.Attend.Profile.MyBackstages.NotYet', defaultMessage: "Not yet" })
                                                                        )}
                                                                    </Td>
                                                                    <Td>
                                                                        {isNow
                                                                            ? intl.formatMessage({ id: 'Conference.Attend.Profile.MyBackstages.Now', defaultMessage: "Now" })
                                                                            : new Date(
                                                                                  backstageStartTime
                                                                              ).toLocaleTimeString(undefined, {
                                                                                  minute: "2-digit",
                                                                                  hour: "2-digit",
                                                                              })}
                                                                    </Td>
                                                                    <Td>
                                                                        {isLive
                                                                            ? intl.formatMessage({ id: 'Conference.Attend.Profile.MyBackstages.LiveNow', defaultMessage: "Live now" })
                                                                            : startAt.toLocaleTimeString(undefined, {
                                                                                  minute: "2-digit",
                                                                                  hour: "2-digit",
                                                                              })}
                                                                    </Td>
                                                                    <Td maxW="12em">{x.name}</Td>
                                                                    <Td maxW="25em">{x.item?.title ?? ""}</Td>
                                                                    <Td maxW="15em">
                                                                        {x.room ? (
                                                                            <Link
                                                                                href={`/conference/${conference.slug}/room/${x.room.id}`}
                                                                            >
                                                                                <FAIcon
                                                                                    icon="link"
                                                                                    iconStyle="s"
                                                                                    fontSize="xs"
                                                                                    mr={2}
                                                                                />
                                                                                <chakra.span>{x.room.name}</chakra.span>
                                                                            </Link>
                                                                        ) : (
                                                                            "<Error: Unknown room>"
                                                                        )}
                                                                    </Td>
                                                                </Tr>
                                                            );
                                                        })}
                                                    </Tbody>
                                                </Table>
                                            </AccordionPanel>
                                        </AccordionItem>,
                                    ];
                                }, [] as JSX.Element[])}
                            </Accordion>
                        </>
                    )}
                </>
            ) : undefined}
        </>
    );
}

interface MyBackstagesModalContext {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const MyBackstagesModalContext = React.createContext<MyBackstagesModalContext | undefined>(undefined);

export function useMyBackstagesModal(): MyBackstagesModalContext {
    const ctx = React.useContext(MyBackstagesModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function MyBackstagesModalProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const myBackstagesButtonRef = useRef<FocusableElement>(null);

    const ctx: MyBackstagesModalContext = useMemo(
        () => ({
            finalFocusRef: myBackstagesButtonRef,
            isOpen,
            onOpen,
            onClose,
        }),
        [onOpen, isOpen, onClose]
    );

    const maybeRegistrant = useMaybeCurrentRegistrant();

    return (
        <MyBackstagesModalContext.Provider value={ctx}>
            {children}
            {maybeRegistrant ? (
                <MyBackstagesModal isOpen={isOpen} onClose={onClose} finalFocusRef={myBackstagesButtonRef} />
            ) : undefined}
        </MyBackstagesModalContext.Provider>
    );
}

export function MyBackstagesModal({
    isOpen,
    onClose,
    finalFocusRef,
}: {
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}): JSX.Element {
    const closeRef = useRef<HTMLButtonElement | null>(null);

    const registrant = useCurrentRegistrant();

    return (
        <Modal
            initialFocusRef={closeRef}
            finalFocusRef={finalFocusRef}
            size="6xl"
            isCentered
            autoFocus={false}
            returnFocusOnClose={false}
            trapFocus={true}
            scrollBehavior="inside"
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>My Backstages ({registrant.displayName})</ModalHeader>
                <ModalCloseButton ref={closeRef} />
                <ModalBody>
                    <MyBackstages />
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default function MyBackstagesPage(): JSX.Element {
    const intl = useIntl();
    const title = useTitle(intl.formatMessage({ id: 'Conference.Attend.Profile.MyBackstages.MyBackstages', defaultMessage: "My Backstages" }));
    const registrant = useCurrentRegistrant();

    return (
        <>
            {title}
            <Heading as="h1" id="page-heading">
                <FormattedMessage
                    id="Conference.Attend.Profile.MyBackstages.MyBackstages"
                    defaultMessage="My Backstages"
                />
            </Heading>
            <Heading as="h2" fontSize="lg" fontStyle="italic">
                ({registrant.displayName})
            </Heading>
            <MyBackstages />
        </>
    );
}
