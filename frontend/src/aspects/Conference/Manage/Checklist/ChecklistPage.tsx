import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Alert,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    chakra,
    Divider,
    Grid,
    GridItem,
    Heading,
    ListItem,
    Spinner,
    Text,
    UnorderedList,
    useBreakpointValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import {
    AWSJobStatus,
    Content_ElementType_Enum,
    ElementBaseType,
    isElementDataBlob,
} from "@midspace/shared-types/content";
import { gql } from "@urql/core";
import * as R from "ramda";
import type { PropsWithChildren } from "react";
import React, { Fragment, useMemo } from "react";
import { Room_Mode_Enum, usePreshowChecklistQuery } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageNotFound from "../../../Errors/PageNotFound";
import { roundDownToNearest } from "../../../Generic/MathUtils";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { makeContext } from "../../../GQL/make-context";
import { FAIcon } from "../../../Icons/FAIcon";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";

gql`
    query PreshowChecklist($conferenceId: uuid!, $now: timestamptz!) {
        allTags: collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            name
        }

        itemsWithNoLinkedProgramPeople: content_Item(
            where: {
                conferenceId: { _eq: $conferenceId }
                _not: { itemPeople: { person: { registrantId: { _is_null: false } } } }
            }
        ) {
            id
            title
            itemTags(limit: 1) {
                id
                tagId
            }
            itemPeople(where: { person: { registrantId: { _is_null: true } } }) {
                id
                roleName
                person {
                    id
                    name
                    affiliation
                    email
                }
            }
        }

        requiredProgramPeopleNotLinkedToRegistrant: collection_ProgramPerson(
            where: {
                conferenceId: { _eq: $conferenceId }
                eventPeople: {
                    event: { intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }, endTime: { _gte: $now } }
                }
                registrantId: { _is_null: true }
            }
        ) {
            id
            name
            affiliation
            email
        }

        requiredProgramPeopleNotRegistered: collection_ProgramPerson(
            where: {
                conferenceId: { _eq: $conferenceId }
                eventPeople: {
                    event: { intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }, endTime: { _gte: $now } }
                }
                registrant: { userId: { _is_null: true } }
            }
        ) {
            id
            name
            affiliation
            email
        }

        submissionsNotReceived: content_Element(where: { conferenceId: { _eq: $conferenceId }, data: { _eq: [] } }) {
            id
            name
            typeName
            item {
                id
                title
            }
        }

        livestreamEventsWithoutRegisteredPresenter: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
                _not: { eventPeople: { roleName: { _eq: PRESENTER }, person: { registrantId: { _is_null: false } } } }
            }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
            item {
                id
                title
            }
        }

        livestreamEventsWithoutRegisteredChair: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
                _not: { eventPeople: { roleName: { _eq: CHAIR }, person: { registrantId: { _is_null: false } } } }
            }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
            item {
                id
                title
            }
        }

        prerecordedEventsWithoutVideo: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _eq: PRERECORDED }
                _not: { item: { elements: { typeName: { _eq: VIDEO_BROADCAST } } } }
            }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
            item {
                id
                title
            }
        }

        prerecordedEventsWithVideo: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _eq: PRERECORDED }
                item: { elements: { typeName: { _eq: VIDEO_BROADCAST } } }
            }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
            item {
                id
                title
                elements(where: { typeName: { _eq: VIDEO_BROADCAST } }) {
                    id
                    name
                    data
                }
            }
        }

        zoomEvents: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _eq: ZOOM }
            }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
            item {
                id
                title
                elements(where: { typeName: { _eq: ZOOM } }) {
                    id
                    name
                    data
                }
            }
        }

        allLiveEventsWithPeople: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
            }
        ) {
            id
            name
            intendedRoomModeName
            room {
                id
                name
            }
            item {
                id
                title
                itemPeopleWithRegistrant: itemPeople(where: { person: { registrantId: { _is_null: false } } }) {
                    personId
                }
                itemPeopleWithoutRegistrant: itemPeople(where: { person: { registrantId: { _is_null: true } } }) {
                    personId
                }
            }
            exhibition {
                id
                name
            }
            startTime
            endTime
            eventPeople {
                id
                personId
            }
        }

        emptyExhibitions: collection_Exhibition(where: { conferenceId: { _eq: $conferenceId }, _not: { items: {} } }) {
            id
            name
        }

        emptyTags: collection_Tag(where: { conferenceId: { _eq: $conferenceId }, _not: { itemTags: {} } }) {
            id
            name
        }

        exhibitionEventsWithoutExhibition: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _in: [EXHIBITION] }
                exhibitionId: { _is_null: true }
            }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
        }

        exhibitionEventsWithoutDiscussionRooms: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _in: [EXHIBITION, NONE] }
                exhibition: { items: { item: { _not: { rooms: {} } } } }
            }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
            exhibition {
                id
                name
                items(where: { item: { _not: { rooms: {} } } }) {
                    id
                    item {
                        id
                        title
                    }
                }
            }
        }

        liveEventsWithoutContent: schedule_Event(
            where: {
                endTime: { _gte: $now }
                conferenceId: { _eq: $conferenceId }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
                itemId: { _is_null: true }
                enableRecording: { _eq: true }
            }
        ) {
            id
            name
            startTime
            endTime
            item {
                id
                title
            }
            room {
                id
                name
            }
        }

        overlappingEvents: schedule_OverlappingEvents(where: { conferenceId: { _eq: $conferenceId } }) {
            eventX {
                id
                name
                startTime
                endTime
                room {
                    id
                    name
                }
            }
            eventY {
                id
                name
                startTime
                endTime
            }
        }

        shortEvents: schedule_Event(
            where: { endTime: { _gte: $now }, conferenceId: { _eq: $conferenceId }, durationSeconds: { _lte: 60 } }
        ) {
            id
            name
            startTime
            endTime
            room {
                id
                name
            }
            item {
                id
                title
            }
        }

        roomsWithStreams: room_Room(where: { conferenceId: { _eq: $conferenceId }, livestreamDuration: {} }) {
            id
            name
            livestreamDuration {
                sum
            }
        }

        eventsWithNegativeDuration: schedule_Event(
            where: { endTime: { _gte: $now }, conferenceId: { _eq: $conferenceId }, durationSeconds: { _lt: 0 } }
        ) {
            id
            name
            startTime
            durationSeconds
            room {
                id
                name
            }
            item {
                id
                title
            }
        }
    }
`;

export function formatDuration(seconds: number): string {
    const NearestHoursInS = roundDownToNearest(seconds, 60 * 60);
    const IntermediateSeconds = seconds - NearestHoursInS;
    const NearestMinutesInS = roundDownToNearest(IntermediateSeconds, 60);
    const NearestSeconds = IntermediateSeconds - NearestMinutesInS;
    const Hours = (NearestHoursInS / (60 * 60)).toFixed(0).padStart(2, "0");
    const Minutes = (NearestMinutesInS / 60).toFixed(0).padStart(2, "0");
    const Seconds = NearestSeconds.toFixed(0).padStart(2, "0");
    return `${Hours}:${Minutes}:${Seconds}`;
}

export default function ChecklistPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Pre-conference checklist at ${conference.shortName}`);

    const now = useMemo(() => new Date().toISOString(), []);
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [checklistResponse] = usePreshowChecklistQuery({
        variables: {
            now,
            conferenceId: conference.id,
        },
        context,
    });

    const emptyTags = useMemo(() => {
        return (
            <ChecklistItem
                title="All tags have at least one item"
                status="warning"
                description="We recommend that all tags have at least one item. Empty tags can be confusing for attendees. If you do not have any items to add to a tag, please consider deleting it."
                action={{
                    title: "Manage Tags",
                    url: "content",
                }}
                ok={checklistResponse.data?.emptyTags.length === 0}
            >
                <Text>The following tags are empty:</Text>
                <ExpandableList items={checklistResponse.data?.emptyTags} sortBy={(x) => x.name}>
                    {(tag) => <>{tag.name}</>}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.emptyTags]);

    const emptyExhibitions = useMemo(() => {
        return (
            <ChecklistItem
                title="All exhibitions have at least one item"
                status="warning"
                description="We recommend that all exhibitions have at least one item. Empty exhibitions can be confusing for attendees. If you do not have any items to add to an exhibition, please consider deleting it."
                action={{
                    title: "Manage Exhibitions",
                    url: "content",
                }}
                ok={checklistResponse.data?.emptyExhibitions.length === 0}
            >
                <Text>The following exhibitions are empty:</Text>
                <ExpandableList items={checklistResponse.data?.emptyExhibitions} sortBy={(x) => x.name}>
                    {(exh) => <>{exh.name}</>}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.emptyExhibitions]);

    const itemsWithPeopleNotLinkedToRegistrant = useMemo(() => {
        return (
            <ChecklistItem
                title="Items with no people linked to a registrant"
                status="info"
                description="This information is sometimes useful to identify items where people have not been fully linked to registrants."
                action={{
                    title: "Manage Program People",
                    url: "people",
                }}
                ok={checklistResponse.data?.itemsWithNoLinkedProgramPeople.length === 0}
            >
                <Text>The following Content Items have no Program People that are linked to a Registrant:</Text>
                <ExpandableList
                    items={checklistResponse.data?.itemsWithNoLinkedProgramPeople}
                    sortBy={(x) => x.title ?? "<ERROR>"}
                    groupBy={(x) => x.itemTags[0]?.tagId ?? "<No tag>"}
                    nameGroup={(tagId) =>
                        checklistResponse.data?.allTags.find((x) => x.id === tagId)?.name ?? "Unknown tag: " + tagId
                    }
                >
                    {(x) => (
                        <>
                            <chakra.span>{x.title}</chakra.span>
                            <UnorderedList pl={4}>
                                {x.itemPeople.map((itemPerson) => (
                                    <ListItem key={itemPerson.id}>
                                        {itemPerson.person?.name}{" "}
                                        {itemPerson.person?.affiliation ? `(${itemPerson.person?.affiliation})` : ""}{" "}
                                        {itemPerson.person?.email ? `<${itemPerson.person?.email}>` : ""} (
                                        {itemPerson.roleName})
                                    </ListItem>
                                ))}
                            </UnorderedList>
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.allTags, checklistResponse.data?.itemsWithNoLinkedProgramPeople]);

    const requiredPeopleNotLinkedToRegistrant = useMemo(() => {
        return (
            <ChecklistItem
                title="All people required at a live-stream event are linked to a registrant"
                status="error"
                description="Live-stream events are assigned Program People, enabling access to the respective backstages. In order for users to access their backstages, the corresponding Program Person needs to be linked to their Registrant."
                action={{
                    title: "Manage Program People",
                    url: "people",
                }}
                ok={checklistResponse.data?.requiredProgramPeopleNotLinkedToRegistrant.length === 0}
            >
                <Text>
                    The following Program People are assigned to a live-stream event but are not linked to a Registrant:
                </Text>
                <ExpandableList
                    items={checklistResponse.data?.requiredProgramPeopleNotLinkedToRegistrant}
                    sortBy={(x) => x.name ?? "<ERROR>"}
                >
                    {(x) => (
                        <>
                            {x.name} {x.affiliation ? `(${x.affiliation})` : ""} {x.email ? `<${x.email}>` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.requiredProgramPeopleNotLinkedToRegistrant]);

    const requiredPeopleNotRegistered = useMemo(() => {
        return (
            <ChecklistItem
                title="All people required at a live-stream event have completed registration"
                status="error"
                description="Users that are expected to participant in a live-stream event need to complete registration to access their backstages."
                action={{
                    title: "Manage Registrants",
                    url: "registrants",
                }}
                ok={checklistResponse.data?.requiredProgramPeopleNotRegistered.length === 0}
            >
                <Text>
                    The following people are assigned to a live-stream event but have not completed registration:
                </Text>
                <ExpandableList
                    items={checklistResponse.data?.requiredProgramPeopleNotRegistered}
                    sortBy={(x) => x.name ?? "<ERROR>"}
                >
                    {(x) => (
                        <>
                            {x.name} {x.affiliation ? `(${x.affiliation})` : ""} {x.email ? `<${x.email}>` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.requiredProgramPeopleNotRegistered]);

    const livestreamEventsHaveAPerson = useMemo(() => {
        const filteredEvents = checklistResponse.data?.livestreamEventsWithoutRegisteredPresenter.filter((eventX) =>
            checklistResponse.data?.livestreamEventsWithoutRegisteredChair.some((eventY) => eventY.id === eventX.id)
        );
        return (
            <ChecklistItem
                title="All live-stream events have at least one presenter or chair who is linked to a registrant"
                status="error"
                description="Presenters and chairs are the normal roles for people presenting during a live-stream event. All live-stream events must have at least one person with the Chair or Presenter role. They should also be linked to a registrant, to allow access to their backstage."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={filteredEvents?.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={filteredEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}{" "}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [
        checklistResponse.data?.livestreamEventsWithoutRegisteredPresenter,
        checklistResponse.data?.livestreamEventsWithoutRegisteredChair,
    ]);

    const livestreamEventsHaveAPresenter = useMemo(() => {
        return (
            <ChecklistItem
                title="All live-stream events have at least one presenter who is linked to a registrant"
                status="error"
                description="Presenters and chairs are the normal roles for people presenting during a live-stream event. All live-stream events should have at least one person with the Presenter role. They should also be linked to a registrant, to allow access to their backstage."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={checklistResponse.data?.livestreamEventsWithoutRegisteredPresenter.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.livestreamEventsWithoutRegisteredPresenter}
                    sortBy={(x) => Date.parse(x.startTime)}
                >
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}{" "}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.livestreamEventsWithoutRegisteredPresenter]);

    const livestreamEventsHaveAChair = useMemo(() => {
        return (
            <ChecklistItem
                title="All live-stream events have at least one chair who is linked to a registrant"
                status="warning"
                description="Presenters and chairs are the normal roles for people presenting during a live-stream event. We recommend that all live-stream events have a chair. They should also be linked to a registrant, to allow access to their backstage."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={checklistResponse.data?.livestreamEventsWithoutRegisteredChair.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.livestreamEventsWithoutRegisteredChair}
                    sortBy={(x) => Date.parse(x.startTime)}
                >
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.livestreamEventsWithoutRegisteredChair]);

    const eventPeopleSyncedToContentPeople = useMemo(() => {
        const nonsyncedEvents = checklistResponse.data?.allLiveEventsWithPeople.filter(
            (event) =>
                event.item &&
                ![...event.item.itemPeopleWithRegistrant, ...event.item.itemPeopleWithoutRegistrant].every(
                    (itemPerson) =>
                        event.eventPeople.some((eventPerson) => eventPerson.personId === itemPerson.personId)
                )
        );
        return (
            <ChecklistItem
                title="Event people are synchronised to content people"
                status="warning"
                description={
                    'We recommend using the "Add people to events (batch)" option in the Schedule to copy across all people from content to their respective events.'
                }
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={!!nonsyncedEvents && nonsyncedEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={nonsyncedEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.allLiveEventsWithPeople]);

    const eventPeopleSyncedToContentPeopleWithRegistrant = useMemo(() => {
        const nonsyncedEvents = checklistResponse.data?.allLiveEventsWithPeople.filter(
            (event) =>
                event.item &&
                !event.item.itemPeopleWithRegistrant.every((itemPerson) =>
                    event.eventPeople.some((eventPerson) => eventPerson.personId === itemPerson.personId)
                )
        );
        return (
            <ChecklistItem
                title="Event people are synchronised to registered content people"
                status="warning"
                description={
                    'We recommend using the "Add people to events (batch)" option in the Schedule to copy across all people from content to their respective events.'
                }
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={!!nonsyncedEvents && nonsyncedEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={nonsyncedEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.allLiveEventsWithPeople]);

    const submissionsNotReceived = useMemo(() => {
        return (
            <ChecklistItem
                title="All submissions received"
                status="warning"
                description="One or more uploadable elements have not been submitted. Please use the Submission Review option in the Manage Content page to review missing submissions."
                action={{
                    title: "Manage Content",
                    url: "content",
                }}
                ok={checklistResponse.data?.submissionsNotReceived.length === 0}
            >
                <Text>The following uploadables have not been submitted:</Text>
                <ExpandableList
                    items={checklistResponse.data?.submissionsNotReceived}
                    sortBy={(x) => x.item?.title ?? x.name}
                >
                    {(x) => (
                        <>
                            {x.name}: {x.item?.title ?? "Unknown item"}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.submissionsNotReceived]);

    const videoSubmissionsNotReceived = useMemo(() => {
        const filteredSubmissions = checklistResponse.data?.submissionsNotReceived.filter(
            (uploadable) =>
                uploadable.typeName === Content_ElementType_Enum.VideoBroadcast ||
                uploadable.typeName === Content_ElementType_Enum.VideoPrepublish ||
                uploadable.typeName === Content_ElementType_Enum.VideoFile
        );
        return (
            <ChecklistItem
                title="All video submissions received"
                status="warning"
                description="One or more uploadable video elements have not been submitted. This is likely to be a problem if you are using videos as part of live-streaming. Please use the Submission Review option in the Manage Content page to review missing submissions."
                action={{
                    title: "Manage Content",
                    url: "content",
                }}
                ok={filteredSubmissions?.length === 0}
            >
                <Text>The following uploadables have not been submitted:</Text>
                <ExpandableList items={filteredSubmissions} sortBy={(x) => x.item?.title ?? x.name}>
                    {(x) => (
                        <>
                            {x.name}: {x.item?.title ?? "Unknown item"}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.submissionsNotReceived]);

    const prerecordedEventsHaveItem = useMemo(() => {
        const filteredEvents = checklistResponse.data?.allLiveEventsWithPeople.filter(
            (event) => event.intendedRoomModeName === Room_Mode_Enum.Prerecorded && !event.item
        );
        return (
            <ChecklistItem
                title="All pre-recorded events have been assigned a content item"
                status="error"
                description="Pre-recorded events pick up the Broadcast Video from their assigned content item. One or more 'pre-recorded' mode events has not been assigned an item and so will not be able to play back a video. This may be caused by a missing video submission. Please review your schedule and content to upload the missing video(s) or remove the events from the schedule."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={!!filteredEvents && filteredEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={filteredEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.allLiveEventsWithPeople]);

    const prerecordedEventsHaveVideoElement = useMemo(() => {
        return (
            <ChecklistItem
                title="All pre-recorded events have an item with a broadcast video element"
                status="error"
                description="Pre-recorded events pick up the Broadcast Video from their assigned content item. One or more 'pre-recorded' mode events has been assigned an item that does not have a broadcast video element and so will not be able to play back a video. This may be caused by a missing video submission. Please review your schedule and content to upload the missing video(s) or remove the events from the schedule."
                action={{
                    title: "Manage Content",
                    url: "content",
                }}
                ok={checklistResponse.data?.prerecordedEventsWithoutVideo.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.prerecordedEventsWithoutVideo}
                    sortBy={(x) => Date.parse(x.startTime)}
                >
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.prerecordedEventsWithoutVideo]);

    const prerecordedEventsHaveVideo = useMemo(() => {
        const filteredEvents = checklistResponse.data?.prerecordedEventsWithVideo.filter(
            (event) =>
                !event.item ||
                !event.item.elements.some((element) => {
                    if (isElementDataBlob(element.data)) {
                        const data = element.data as ElementDataBlob;
                        const version = R.last(data);
                        return (
                            version?.data.type === Content_ElementType_Enum.VideoBroadcast &&
                            version?.data.transcode &&
                            version?.data.transcode.s3Url &&
                            version?.data.transcode.s3Url !== "" &&
                            version?.data.transcode.status === AWSJobStatus.Completed
                        );
                    }
                    return false;
                })
        );
        return (
            <ChecklistItem
                title="All pre-recorded events whose items have a broadcast video element have had a video uploaded"
                status="error"
                description="Pre-recorded events pick up the Broadcast Video from their assigned content item. One or more 'pre-recorded' mode events has been assigned an item which has a broadcast video element for which a file has not been uploaded. This means the event will not be able to play back a video. This may be caused by a missing video submission. Please review your schedule and content to upload the missing video(s) or remove the events from the schedule."
                action={{
                    title: "Manage Content",
                    url: "content",
                }}
                ok={!!filteredEvents && filteredEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={filteredEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.prerecordedEventsWithVideo]);

    const prerecordedEventsVideosDontExceedTime = useMemo(() => {
        const filteredEvents = checklistResponse.data?.prerecordedEventsWithVideo.filter(
            (event) =>
                event.item &&
                event.item.elements.some((element) => {
                    if (isElementDataBlob(element.data)) {
                        const data = element.data as ElementDataBlob;
                        const version = data.find(
                            (version) =>
                                version.data.type === Content_ElementType_Enum.VideoBroadcast &&
                                version.data.broadcastTranscode &&
                                version.data.broadcastTranscode.s3Url &&
                                version.data.broadcastTranscode.s3Url !== ""
                        );
                        if (
                            version?.data.baseType === ElementBaseType.Video &&
                            version.data.broadcastTranscode &&
                            version.data.broadcastTranscode.durationSeconds !== undefined
                        ) {
                            return (
                                version.data.broadcastTranscode.durationSeconds >
                                (Date.parse(event.endTime) - Date.parse(event.startTime)) / 1000
                            );
                        }
                    }
                    return false;
                })
        );
        return (
            <ChecklistItem
                title="All videos for pre-recorded events are equal or shorter than the available time."
                status="error"
                description="Pre-recorded events pick up the Broadcast Video from their assigned content item. One or more 'pre-recorded' mode events has been assigned an item with a broadcast video longer than the scheduled event. This means the video will be cut short when played back in the stream (i.e. the end of the video will be cut-off)."
                action={{
                    title: "Manage Content",
                    url: "content",
                }}
                ok={!!filteredEvents && filteredEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={filteredEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.prerecordedEventsWithVideo]);

    const prerecordedEventsVideosMatchTime = useMemo(() => {
        const filteredEvents = checklistResponse.data?.prerecordedEventsWithVideo.filter(
            (event) =>
                event.item &&
                event.item.elements.some((element) => {
                    if (isElementDataBlob(element.data)) {
                        const data = element.data as ElementDataBlob;
                        const version = data.find(
                            (version) =>
                                version.data.type === Content_ElementType_Enum.VideoBroadcast &&
                                version.data.broadcastTranscode &&
                                version.data.broadcastTranscode.s3Url &&
                                version.data.broadcastTranscode.s3Url !== ""
                        );
                        if (
                            version?.data.baseType === ElementBaseType.Video &&
                            version.data.broadcastTranscode &&
                            version.data.broadcastTranscode.durationSeconds !== undefined
                        ) {
                            const d = (Date.parse(event.endTime) - Date.parse(event.startTime)) / 1000;
                            const diff = version.data.broadcastTranscode.durationSeconds - d;
                            if (Math.abs(diff) > 1) {
                                console.log("Event duration difference: ", {
                                    eventId: event.id,
                                    difference: `${Math.abs(diff)} seconds (${diff < 0 ? "too long" : "too short"})`,
                                });
                                return true;
                            }
                        }
                    }
                    return false;
                })
        );
        return (
            <ChecklistItem
                title="All videos for pre-recorded events are equal to the available time."
                status="warning"
                description="Pre-recorded events pick up the Broadcast Video from their assigned content item. One or more 'pre-recorded' mode events has been assigned an item with a broadcast video not equal in duration to the scheduled event. This means the video will be cut short (if the event is too short) or the stream will play the filler video during the unused time (if the event is too long)."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={!!filteredEvents && filteredEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={filteredEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.prerecordedEventsWithVideo]);

    const videoPlayerEventsHaveItem = useMemo(() => {
        const filteredEvents = checklistResponse.data?.allLiveEventsWithPeople.filter(
            (event) => event.intendedRoomModeName === Room_Mode_Enum.VideoPlayer && !event.item
        );
        return (
            <ChecklistItem
                title="All video-player events have been assigned a content item"
                status="error"
                description="Video-player events show the most recent video elements from their assigned content item. One or more 'video-player' mode events has not been assigned an item and so will not display any videos. Please edit the event(s) to assign content items to them."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={!!filteredEvents && filteredEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={filteredEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.allLiveEventsWithPeople]);

    const zoomEventsHaveZoom = useMemo(() => {
        const filteredEvents = checklistResponse.data?.zoomEvents.filter(
            (event) =>
                !event.item ||
                !event.item.elements.some((ev) => {
                    if (ev.data && isElementDataBlob(ev.data)) {
                        const lastData = R.last(ev.data as ElementDataBlob)?.data;
                        if (lastData) {
                            return lastData.type === Content_ElementType_Enum.Zoom && !!lastData.url?.length;
                        }
                    }
                    return false;
                })
        );
        return (
            <ChecklistItem
                title="All Zoom events have been assigned a content item with a valid Zoom element"
                status="error"
                description="Zoom events show a button that links to Zoom. The link is found from a Zoom element on the event's content item. All Zoom events must have a content item with a Zoom element that contains a valid Zoom link."
                action={{
                    title: "Manage Content",
                    url: "content",
                }}
                ok={!!filteredEvents && filteredEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={filteredEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.zoomEvents]);

    const exhibitionEventsWithoutExhibition = useMemo(() => {
        return (
            <ChecklistItem
                title="All exhibition events have an exhibition"
                status="error"
                description="One or more 'exhibition' mode events has not been assigned an exhibition. Please edit your schedule to assign an exhibition to each exhibition-mode event."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={checklistResponse.data?.exhibitionEventsWithoutExhibition.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.exhibitionEventsWithoutExhibition}
                    sortBy={(x) => Date.parse(x.startTime)}
                >
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}: {x.name}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.exhibitionEventsWithoutExhibition]);

    const exhibitionEventsWithoutDiscussionRooms = useMemo(() => {
        return (
            <ChecklistItem
                title="All items in an exhibition event have a discussion room"
                status="error"
                description="One or more exhibition-mode events has been assigned an exhibition that contains items that do not have a discussion room. Please use the Manage Content page to edit relevant items and click 'Create discussion room'."
                action={{
                    title: "Manage Content",
                    url: "content",
                }}
                ok={checklistResponse.data?.exhibitionEventsWithoutDiscussionRooms.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.exhibitionEventsWithoutDiscussionRooms}
                    sortBy={(x) => Date.parse(x.startTime)}
                >
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}: {x.name}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.exhibitionEventsWithoutDiscussionRooms]);

    const liveEventsWithoutContent = useMemo(() => {
        return (
            <ChecklistItem
                title="For recordings to be stored, all live-stream events have been assigned an item"
                status="warning"
                description={
                    "One or more live-stream (presentation / Q&A) events has not been assigned a content item. The recording of these events will not be stored. If you wish to keep the recordings, please assign a content item to them."
                }
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={checklistResponse.data?.liveEventsWithoutContent.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.liveEventsWithoutContent}
                    sortBy={(x) => Date.parse(x.startTime)}
                >
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.liveEventsWithoutContent]);

    const overlappingEvents = useMemo(() => {
        return (
            <ChecklistItem
                title="Events in the same room do not overlap"
                status="error"
                description="Oops, how did this happen! One or more events in the same room overlaps. Please edit your schedule to ensure events do not overlap. If this issue persists, please contact Midspace tech support."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={checklistResponse.data?.overlappingEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.overlappingEvents}
                    sortBy={(x) => (x.eventX ? Date.parse(x.eventX.startTime) : 0)}
                >
                    {(x) =>
                        x.eventX && x.eventY ? (
                            <>
                                {new Date(x.eventX.startTime).toLocaleString()} - {x.eventX.room?.name}: {x.eventX.name}
                                <br />
                                overlaps with
                                <br />
                                {new Date(x.eventY.startTime).toLocaleString()}: {x.eventY.name}
                            </>
                        ) : (
                            <>Unknown events</>
                        )
                    }
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.overlappingEvents]);

    const shortEvents = useMemo(() => {
        return (
            <ChecklistItem
                title="All events are longer than 60 seconds"
                status="warning"
                description="We do not recommend having events that are shorter than 60 seconds. Please consider modifying your schedule to lengthen these events."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={checklistResponse.data?.shortEvents.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList items={checklistResponse.data?.shortEvents} sortBy={(x) => Date.parse(x.startTime)}>
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.shortEvents]);

    const eventsWithNegativeDuration = useMemo(() => {
        return (
            <ChecklistItem
                title="All events have positive duration"
                status="error"
                description="Oops, how did this happen! One or more events has a negative duration. Please edit your schedule to ensure events end after they start. If this issue persists, please contact Midspace tech support."
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
                ok={checklistResponse.data?.eventsWithNegativeDuration.length === 0}
            >
                <Text>The following events do not meet the requirements of this rule:</Text>
                <ExpandableList
                    items={checklistResponse.data?.eventsWithNegativeDuration}
                    sortBy={(x) => Date.parse(x.startTime)}
                >
                    {(x) => (
                        <>
                            {new Date(x.startTime).toLocaleString()} - {x.room?.name}
                            <br />
                            {x.name}: {x.item ? `"${x.item.title}"` : ""}
                        </>
                    )}
                </ExpandableList>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.eventsWithNegativeDuration]);

    const roomsWithStreams = useMemo(() => {
        return (
            <ChecklistItem
                title="Summary of streams"
                status="info"
                description="The following is a summary of the live-streams scheduled to take place in each room (including past streams)."
                ok={false}
                action={{
                    title: "Manage Schedule",
                    url: "schedule",
                }}
            >
                <Text>Streams listed by room:</Text>
                <Grid rowGap={2} columnGap={4} templateColumns="auto auto">
                    <GridItem fontWeight="bold">Room name</GridItem>
                    <GridItem fontWeight="bold">Duration (hh:mm:ss)</GridItem>
                    {checklistResponse.data?.roomsWithStreams &&
                        R.sortBy((x) => x.name, checklistResponse.data.roomsWithStreams).map((x) => (
                            <>
                                <GridItem key={x.id + "-col1"}>{x.name}</GridItem>
                                <GridItem key={x.id + "-col2"}>
                                    {x.livestreamDuration?.sum
                                        ? formatDuration(x.livestreamDuration.sum)
                                        : "Unknown duration"}
                                </GridItem>
                            </>
                        ))}
                </Grid>
            </ChecklistItem>
        );
    }, [checklistResponse.data?.roomsWithStreams]);

    const defaultColSpan = useBreakpointValue({
        base: 2,
        lg: 1,
    });

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Heading mt={4} as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Pre-conference Checklist
            </Heading>
            {checklistResponse.fetching && !checklistResponse.data ? <Spinner label="Loading checks" /> : undefined}
            {checklistResponse.data ? (
                <Accordion allowToggle maxW={800}>
                    <Grid alignItems="stretch" rowGap={2} columnGap={4} templateColumns="auto auto">
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>
                            <VStack alignItems="flex-start">
                                <Text fontStyle="italic">Rules</Text>
                                <Text>
                                    Each rule is automatically checked. If a check fails, it will display an exclamation
                                    mark and either a recommendation (for non-critical checks that you should consider)
                                    or a resolution (for critical issues that need to be fixed).
                                </Text>
                            </VStack>
                        </GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>
                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h3" fontSize="xl" textAlign="left">
                                Content
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{emptyTags}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{emptyExhibitions}</GridItem>
                        <GridItem colSpan={2} rowSpan={3}></GridItem>
                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h3" fontSize="xl" textAlign="left">
                                Submissions
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{submissionsNotReceived}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{videoSubmissionsNotReceived}</GridItem>
                        <GridItem colSpan={2} rowSpan={3}></GridItem>
                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h3" fontSize="xl" textAlign="left">
                                People
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{itemsWithPeopleNotLinkedToRegistrant}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{requiredPeopleNotLinkedToRegistrant}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{requiredPeopleNotRegistered}</GridItem>
                        <GridItem colSpan={2} rowSpan={3}></GridItem>
                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h3" fontSize="xl" textAlign="left">
                                Events
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{overlappingEvents}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{shortEvents}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{eventsWithNegativeDuration}</GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>

                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h4" fontSize="md" textAlign="left">
                                Event People
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{eventPeopleSyncedToContentPeople}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{eventPeopleSyncedToContentPeopleWithRegistrant}</GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>

                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h4" fontSize="md" textAlign="left">
                                Live-stream events
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{roomsWithStreams}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{livestreamEventsHaveAPerson}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{livestreamEventsHaveAPresenter}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{livestreamEventsHaveAChair}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{liveEventsWithoutContent}</GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>

                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h4" fontSize="md" textAlign="left">
                                Pre-recorded events
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{prerecordedEventsHaveItem}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{prerecordedEventsHaveVideoElement}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{prerecordedEventsHaveVideo}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{prerecordedEventsVideosDontExceedTime}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{prerecordedEventsVideosMatchTime}</GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>

                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h4" fontSize="md" textAlign="left">
                                Video-player events
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{videoPlayerEventsHaveItem}</GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>

                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h4" fontSize="md" textAlign="left">
                                Zoom events
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{zoomEventsHaveZoom}</GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>

                        <GridItem colSpan={defaultColSpan}>
                            <Heading as="h4" fontSize="md" textAlign="left">
                                Exhibition events
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={defaultColSpan}>{exhibitionEventsWithoutExhibition}</GridItem>
                        <GridItem colSpan={defaultColSpan}></GridItem>
                        <GridItem colSpan={defaultColSpan}>{exhibitionEventsWithoutDiscussionRooms}</GridItem>
                        <GridItem colSpan={2} rowSpan={2}></GridItem>
                    </Grid>
                </Accordion>
            ) : undefined}
        </RequireRole>
    );
}

function ExpandableList<T>({
    items: unsortedItems,
    children,
    sortBy,
    groupBy,
    nameGroup,
    limit = 10,
}: {
    items?: readonly T[] | null;
    children: (item: T) => JSX.Element;
    sortBy: (item: T) => R.Ord;
    groupBy?: (item: T) => string;
    nameGroup?: (key: string) => string;
    limit?: number;
}): JSX.Element {
    const { isOpen, onToggle } = useDisclosure();

    const items = useMemo(() => unsortedItems && R.sortBy(sortBy, unsortedItems), [unsortedItems, sortBy]);
    const groupedItems = useMemo(() => groupBy && items && R.groupBy(groupBy, items), [groupBy, items]);

    if (items) {
        return (
            <>
                <Text>({items?.length} items)</Text>
                {!groupedItems ? (
                    <>
                        <UnorderedList spacing={2}>
                            {(isOpen ? items : items.length > limit + 1 ? items.slice(0, limit) : items).map(
                                (x, idx) => (
                                    <ListItem key={idx}>{children(x)}</ListItem>
                                )
                            )}
                            {!isOpen && items.length > limit + 1 ? (
                                <ListItem>and {items.length - limit} more.</ListItem>
                            ) : undefined}
                        </UnorderedList>
                        {items.length > limit + 1 ? (
                            <Button size="sm" onClick={onToggle} variant="outline" colorScheme="pink">
                                {isOpen ? "Show fewer" : "Show all"}
                            </Button>
                        ) : undefined}
                    </>
                ) : (
                    <VStack spacing={6} alignItems="flex-start">
                        {items.length > limit + 1 ? (
                            <Button size="sm" onClick={onToggle} variant="outline" colorScheme="pink">
                                {isOpen ? "Show fewer" : "Show all"}
                            </Button>
                        ) : undefined}
                        {Object.keys(groupedItems)
                            .sort((x, y) => {
                                const xName = nameGroup ? nameGroup(x) : x;
                                const yName = nameGroup ? nameGroup(y) : y;
                                return xName.localeCompare(yName);
                            })
                            .map((groupKey) => {
                                const groupItems = groupedItems[groupKey];
                                return (
                                    <Fragment key={groupKey}>
                                        <Heading as="h5" fontSize="md" textAlign="left">
                                            {nameGroup ? nameGroup(groupKey) : groupKey}
                                        </Heading>
                                        <UnorderedList spacing={2}>
                                            {(isOpen
                                                ? groupItems
                                                : items.length > limit + 1
                                                ? groupItems.slice(0, 5)
                                                : groupItems
                                            ).map((x, idx) => (
                                                <ListItem key={idx}>{children(x)}</ListItem>
                                            ))}
                                            {!isOpen && groupItems.length > limit + 1 ? (
                                                <ListItem>and {groupItems.length - 5} more.</ListItem>
                                            ) : undefined}
                                        </UnorderedList>
                                        <Divider />
                                    </Fragment>
                                );
                            })}
                        {items.length > limit + 1 ? (
                            <Button size="sm" onClick={onToggle} variant="outline" colorScheme="blue">
                                {isOpen ? "Show fewer" : "Show all"}
                            </Button>
                        ) : undefined}
                    </VStack>
                )}
            </>
        );
    }
    return <>No items list at the moment. This may be blocked by another issue.</>;
}

function ChecklistItem({
    children,
    ok,
    title,
    status,
    description,
    action: { title: actionTitle, url: actionURL },
}: PropsWithChildren<{
    ok: boolean;
    title: string;
    status: "error" | "warning" | "info";
    description: string;
    action: {
        title: string;
        url: string;
    };
}>): JSX.Element {
    const { conferencePath } = useAuthParameters();

    return (
        <AccordionItem flex="1">
            <Alert status={ok ? "success" : status}>
                <AlertIcon />
                <AlertTitle>{title}</AlertTitle>
            </Alert>

            {!ok ? (
                <>
                    <AccordionButton>
                        <AccordionIcon mr={2} />
                        <Box flex="1" textAlign="left">
                            {status === "error"
                                ? "Resolution"
                                : status === "warning"
                                ? "Recommendation"
                                : "Information"}
                        </Box>
                    </AccordionButton>
                    <AccordionPanel>
                        <VStack spacing={3} alignItems="flex-start">
                            <Text>{description}</Text>
                            <LinkButton isExternal size="md" to={`${conferencePath}/manage/${actionURL}`}>
                                <FAIcon iconStyle="s" icon="link" mr={2} />
                                <chakra.span>{actionTitle}</chakra.span>
                                <ExternalLinkIcon ml={2} />
                            </LinkButton>
                            {children}
                        </VStack>
                    </AccordionPanel>
                </>
            ) : undefined}
        </AccordionItem>
    );
}
