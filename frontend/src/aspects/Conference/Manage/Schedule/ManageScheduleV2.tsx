import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    chakra,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Input,
    Select,
    Spacer,
    Spinner,
    useColorModeValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { UseQueryState } from "urql";
import { gql, useClient } from "urql";
import { NIL as NIL_UUID } from "uuid";
import type {
    ManageSchedule_ElementFragment,
    ManageSchedule_GetAllSessionIdsQuery,
    ManageSchedule_GetAllSessionIdsQueryVariables,
    ManageSchedule_GetExistingExhibitionQuery,
    ManageSchedule_GetExistingExhibitionQueryVariables,
    ManageSchedule_GetExistingItemQuery,
    ManageSchedule_GetExistingItemQueryVariables,
    ManageSchedule_GetPotentiallyOverlappingEventsQuery,
    ManageSchedule_GetPotentiallyOverlappingEventsQueryVariables,
    ManageSchedule_GetSessionsPageQuery,
    ManageSchedule_InsertEventMutation,
    ManageSchedule_InsertEventMutationVariables,
    ManageSchedule_InsertItemMutation,
    ManageSchedule_InsertItemMutationVariables,
    ManageSchedule_PresentationFragment,
    ManageSchedule_SessionFragment,
    ManageSchedule_UpdateElementMutation,
    ManageSchedule_UpdateElementMutationVariables,
    ManageSchedule_UpdateEventMutation,
    ManageSchedule_UpdateEventMutationVariables,
    ManageSchedule_UpdateItemMutation,
    ManageSchedule_UpdateItemMutationVariables,
    Schedule_Event_Bool_Exp,
} from "../../../../generated/graphql";
import {
    Content_ElementType_Enum,
    Content_ItemType_Enum,
    ManageSchedule_GetAllSessionIdsDocument,
    ManageSchedule_GetExistingExhibitionDocument,
    ManageSchedule_GetExistingItemDocument,
    ManageSchedule_GetPotentiallyOverlappingEventsDocument,
    ManageSchedule_InsertEventDocument,
    ManageSchedule_InsertItemDocument,
    ManageSchedule_UpdateElementDocument,
    ManageSchedule_UpdateEventDocument,
    ManageSchedule_UpdateItemDocument,
    useManageSchedule_GetSessionsPageQuery,
    useManageSchedule_GetTagsQuery,
} from "../../../../generated/graphql";
import SelectButton from "../../../Card/SelectButton";
import { DateTimePicker } from "../../../Chakra/DateTimePicker";
import Editor from "../../../CRUDCards/Editor";
import type { DeepPartial, ValidationState } from "../../../CRUDCards/Types";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
import { useRestorableState } from "../../../Hooks/useRestorableState";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import ContentPanel from "./Components/ContentPanel";
import DeleteModal from "./Components/DeleteModal";
import DetailsPanel from "./Components/DetailsPanel";
import FindExistingContentModal from "./Components/FindExistingContentModal";
import FindExistingExhibitionModal from "./Components/FindExistingExhibitionModal";
import HeaderControls from "./Components/HeaderControls";
import PeoplePanel, { mapItemPersonRoleToEventPersonRole } from "./Components/PeoplePanel";
import type { ScheduleEditorRecord } from "./Components/ScheduleEditorRecord";
import SessionCard from "./Components/SessionCard";
import SettingsPanel from "./Components/SettingsPanel";
import ShiftTimesModal from "./Components/ShiftTimesModal";

gql`
    fragment ManageSchedule_ItemTag on content_ItemTag {
        id
        tagId
    }

    fragment ManageSchedule_ItemPerson on content_ItemProgramPerson {
        id
        personId
        roleName
        priority
    }

    fragment ManageSchedule_EventPerson on schedule_EventProgramPerson {
        id
        personId
        roleName
    }

    fragment ManageSchedule_EventContent on content_Item {
        id
        title
        typeName
        itemTags {
            ...ManageSchedule_ItemTag
        }
        itemPeople {
            ...ManageSchedule_ItemPerson
        }
        abstract: elements(where: { typeName: { _eq: ABSTRACT } }, limit: 1) {
            ...ManageSchedule_Element
        }
        externalEventLink: elements(where: { typeName: { _eq: EXTERNAL_EVENT_LINK } }, limit: 1) {
            ...ManageSchedule_Element
        }
        elements_aggregate {
            aggregate {
                count
            }
        }
    }

    fragment ManageSchedule_Session on schedule_Event {
        id
        conferenceId
        subconferenceId

        name
        scheduledStartTime
        scheduledEndTime
        modeName
        roomId
        itemId
        exhibitionId
        shufflePeriodId

        enableRecording
        autoPlayElementId
        streamTextEventId
        automaticParticipationSurvey

        presentations_aggregate {
            aggregate {
                count
            }
        }

        item {
            ...ManageSchedule_EventContent
        }

        eventPeople {
            ...ManageSchedule_EventPerson
        }
    }

    fragment ManageSchedule_Tag on collection_Tag {
        id
        name
        priority
        colour
    }

    query ManageSchedule_GetTags($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        collection_Tag(
            where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }
            order_by: [{ priority: asc }, { name: asc }]
        ) {
            ...ManageSchedule_Tag
        }
    }

    query ManageSchedule_GetSessionsPage(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $limit: Int!
        $offset: Int!
        $filter: schedule_Event_bool_exp!
    ) {
        schedule_Event_aggregate(
            where: {
                _and: [
                    { conferenceId: { _eq: $conferenceId } }
                    { subconferenceId: $subconferenceCond }
                    { sessionEventId: { _is_null: true } }
                    $filter
                ]
            }
        ) {
            aggregate {
                count
            }
        }

        schedule_Event(
            where: {
                _and: [
                    { conferenceId: { _eq: $conferenceId } }
                    { subconferenceId: $subconferenceCond }
                    { sessionEventId: { _is_null: true } }
                    $filter
                ]
            }
            limit: $limit
            offset: $offset
            order_by: [{ scheduledStartTime: asc }, { scheduledEndTime: asc }, { room: { name: asc } }]
        ) {
            ...ManageSchedule_Session
        }
    }

    query ManageSchedule_GetAllSessionIds(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $filter: schedule_Event_bool_exp!
    ) {
        schedule_Event(
            where: {
                _and: [
                    { conferenceId: { _eq: $conferenceId } }
                    { subconferenceId: $subconferenceCond }
                    { sessionEventId: { _is_null: true } }
                    $filter
                ]
            }
            order_by: [{ scheduledStartTime: asc }, { scheduledEndTime: asc }, { room: { name: asc } }]
        ) {
            id
        }
    }

    mutation ManageSchedule_InsertEvent($object: schedule_Event_insert_input!) {
        insert_schedule_Event_one(object: $object) {
            id
        }
    }

    mutation ManageSchedule_UpdateEvent(
        $id: uuid!
        $event: schedule_Event_set_input!
        $eventPeople: [schedule_EventProgramPerson_insert_input!]!
        $eventPersonIds: [uuid!]!
        $shiftPresentationsByMinutes: Int!
        $roomId: uuid!
    ) {
        update_schedule_Event_by_pk(pk_columns: { id: $id }, _set: $event) {
            id
        }
        updatedPresentations: update_schedule_Event(
            where: { sessionEventId: { _eq: $id } }
            _set: { roomId: $roomId }
        ) {
            affected_rows
        }
        delete_schedule_EventProgramPerson(where: { eventId: { _eq: $id }, id: { _nin: $eventPersonIds } }) {
            affected_rows
        }
        insert_schedule_EventProgramPerson(
            objects: $eventPeople
            on_conflict: { constraint: EventProgramPerson_eventId_personId_roleName_key, update_columns: [roleName] }
        ) {
            affected_rows
        }
        schedule_shiftPresentationTimes(args: { sessionId: $id, minutes: $shiftPresentationsByMinutes }) {
            id
        }
    }

    mutation ManageSchedule_InsertItem($object: content_Item_insert_input!) {
        insert_content_Item_one(object: $object) {
            id
        }
    }

    mutation ManageSchedule_UpdateItem(
        $id: uuid!
        $item: content_Item_set_input!
        $itemPeople: [content_ItemProgramPerson_insert_input!]!
        $itemPersonIds: [uuid!]!
        $itemTags: [content_ItemTag_insert_input!]!
        $itemTagIds: [uuid!]!
        $newElements: [content_Element_insert_input!]!
        $deletedElementIds: [uuid!]!
    ) {
        update_content_Item_by_pk(pk_columns: { id: $id }, _set: $item) {
            id
        }
        delete_content_ItemProgramPerson(where: { itemId: { _eq: $id }, id: { _nin: $itemPersonIds } }) {
            affected_rows
        }
        insert_content_ItemProgramPerson(
            objects: $itemPeople
            on_conflict: {
                constraint: ItemProgramPerson_roleName_personId_itemId_key
                update_columns: [priority, roleName]
            }
        ) {
            affected_rows
        }
        delete_content_ItemTag(where: { itemId: { _eq: $id }, id: { _nin: $itemTagIds } }) {
            affected_rows
        }
        insert_content_ItemTag(
            objects: $itemTags
            on_conflict: { constraint: ItemTag_itemId_tagId_key, update_columns: [] }
        ) {
            affected_rows
        }
        delete_content_Element(where: { itemId: { _eq: $id }, id: { _in: $deletedElementIds } }) {
            affected_rows
        }
        insert_content_Element(objects: $newElements) {
            affected_rows
        }
    }

    mutation ManageSchedule_UpdateElement($id: uuid!, $element: content_Element_set_input!) {
        update_content_Element_by_pk(pk_columns: { id: $id }, _set: $element) {
            id
        }
    }

    fragment ManageSchedule_ItemForExport on content_Item {
        id
        title

        abstract: elements(where: { typeName: { _eq: ABSTRACT } }) {
            id
            data
            uploadsRemaining
        }

        videos: elements_aggregate(
            where: { typeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST] }, uploadsRemaining: { _gt: 0 } }
        ) {
            aggregate {
                count
            }
        }

        images: elements_aggregate(
            where: { typeName: { _in: [IMAGE_FILE, POSTER_FILE] }, uploadsRemaining: { _gt: 0 } }
        ) {
            aggregate {
                count
            }
        }

        slides: elements_aggregate(where: { typeName: { _in: [PAPER_FILE] }, uploadsRemaining: { _gt: 0 } }) {
            aggregate {
                count
            }
        }

        links: elements_aggregate(
            where: { typeName: { _in: [PAPER_URL, LINK, LINK_BUTTON] }, uploadsRemaining: { _gt: 0 } }
        ) {
            aggregate {
                count
            }
        }

        itemPeople(where: { roleName: { _in: ["CHAIR", "SESSION ORGANIZER", "AUTHOR", "PRESENTER", "DISCUSSANT"] } }) {
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

    fragment ManageSchedule_SessionForExport on schedule_Event {
        id
        name
        scheduledStartTime
        scheduledEndTime
        modeName
        roomId
        itemId

        item {
            ...ManageSchedule_ItemForExport

            itemTags {
                id
                tagId
            }
        }

        presentations {
            id
            name
            scheduledStartTime
            scheduledEndTime

            item {
                ...ManageSchedule_ItemForExport
            }
        }

        exhibition {
            name
            descriptiveItem {
                ...ManageSchedule_ItemForExport
            }
            items {
                id
                priority
                item {
                    ...ManageSchedule_ItemForExport
                }
            }
        }

        eventPeople(where: { roleName: { _in: [CHAIR, PRESENTER] } }) {
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

    query ManageSchedule_GetEventsForExport($ids: [uuid!]!) {
        schedule_Event(where: { id: { _in: $ids } }) {
            ...ManageSchedule_SessionForExport
        }
    }

    query ManageSchedule_GetPotentiallyOverlappingEvents(
        $roomId: uuid!
        $startBefore: timestamptz!
        $endAfter: timestamptz!
        $sessionCond: uuid_comparison_exp!
        $excludeId: uuid!
    ) {
        schedule_Event_aggregate(
            where: {
                roomId: { _eq: $roomId }
                scheduledStartTime: { _lt: $startBefore }
                scheduledEndTime: { _gt: $endAfter }
                sessionEventId: $sessionCond
                id: { _neq: $excludeId }
            }
        ) {
            aggregate {
                count
            }
        }
    }

    query ManageSchedule_GetExistingItem($id: uuid!) {
        content_Item_by_pk(id: $id) {
            ...ManageSchedule_EventContent
            room {
                id
            }
        }
    }

    query ManageSchedule_GetExistingExhibition($id: uuid!) {
        collection_Exhibition_by_pk(id: $id) {
            id
            name
            descriptiveItem {
                ...ManageSchedule_EventContent
                room {
                    id
                }
            }
        }
    }
`;

export default function ManageScheduleV2(): JSX.Element {
    const editorDisclosure = useDisclosure();
    const [editorIsCreate, setEditorIsCreate] = useState<boolean>(false);
    const deleteEventsDisclosure = useDisclosure();
    const shiftEventsDisclosure = useDisclosure();
    const addSessionForContentDisclosure = useDisclosure();
    const addSessionForExhibitionDisclosure = useDisclosure();

    const [deleteEventIds, setDeleteEventIds] = useState<string[]>([]);
    const [deleteEventType, setDeleteEventType] = useState<"session" | "presentation">("session");

    const [shiftEventIds, setShiftEventIds] = useState<string[]>([]);

    const [addSessionOrPresentation, setAddSessionOrPresentation] = useState<"session" | "presentation">("session");

    const [addSessionForContentTypeDisplayName, setAddSessionForContentTypeDisplayName] = useState<string>("");
    const [addSessionForContentTypeNames, setAddSessionForContentTypeNames] = useState<Content_ItemType_Enum[]>([]);
    const [addForExistingContentSession, setAddForExistingContentSession] =
        useState<ManageSchedule_SessionFragment | null>(null);

    const [addSessionForExhibitionTypeDisplayName, setAddSessionForExhibitionTypeDisplayName] = useState<string>("");
    const [addForExistingExhibitionSession, setAddForExistingExhibitionSession] =
        useState<ManageSchedule_SessionFragment | null>(null);

    const [initialStepIdx, setInitialStepIdx] = useState<number>(0);
    const [currentRecord, setCurrentRecord] = useState<DeepPartial<ScheduleEditorRecord>>({});

    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const client = useClient();

    const onCreateSession = useCallback(
        (initial?: DeepPartial<ScheduleEditorRecord>) => {
            setCurrentRecord(initial ?? {});
            setInitialStepIdx(0);
            setEditorIsCreate(true);
            setTimeout(() => {
                editorDisclosure.onOpen();
            }, 50);
        },
        [editorDisclosure]
    );
    const onBeginCreateSessionForExistingContent = useCallback(
        (typeDisplayName: string, typeNames: Content_ItemType_Enum[]) => {
            setAddSessionForContentTypeDisplayName(typeDisplayName);
            setAddSessionForContentTypeNames(typeNames);
            setAddSessionOrPresentation("session");
            setAddForExistingContentSession(null);
            addSessionForContentDisclosure.onOpen();
        },
        [addSessionForContentDisclosure]
    );
    const onBeginCreatePresentationForExistingContent = useCallback(
        (session: ManageSchedule_SessionFragment, typeDisplayName: string, typeNames: Content_ItemType_Enum[]) => {
            setAddSessionForContentTypeDisplayName(typeDisplayName);
            setAddSessionForContentTypeNames(typeNames);
            setAddSessionOrPresentation("presentation");
            setAddForExistingContentSession(session);
            addSessionForContentDisclosure.onOpen();
        },
        [addSessionForContentDisclosure]
    );
    const onDoCreateSessionForExistingContent = useCallback(
        async (itemId: string, session: ManageSchedule_SessionFragment | null) => {
            const itemResponse = await client
                .query<ManageSchedule_GetExistingItemQuery, ManageSchedule_GetExistingItemQueryVariables>(
                    ManageSchedule_GetExistingItemDocument,
                    {
                        id: itemId,
                    },
                    context
                )
                .toPromise();

            const item = itemResponse.data?.content_Item_by_pk;
            setCurrentRecord({
                name: item
                    ? item.typeName === Content_ItemType_Enum.Sponsor
                        ? item.title + " - Sponsored session"
                        : item.title
                    : undefined,
                item:
                    item?.typeName === Content_ItemType_Enum.Sponsor
                        ? item
                            ? {
                                  title: item.title + " - Sponsored session",
                                  typeName: Content_ItemType_Enum.Session,
                                  itemPeople: item.itemPeople.map((person) => ({
                                      personId: person.personId,
                                      priority: person.priority,
                                      roleName: person.roleName,
                                  })),
                                  itemTags: item.itemTags.map((tag) => ({
                                      tagId: tag.tagId,
                                  })),
                              }
                            : undefined
                        : item,
                sessionEventId: session?.id,
                roomId:
                    session?.roomId ?? (item?.typeName === Content_ItemType_Enum.Sponsor ? item.room?.id : undefined),
                eventPeople: item
                    ? item.itemPeople.map((x) => ({
                          personId: x.personId,
                          roleName: mapItemPersonRoleToEventPersonRole(x.roleName),
                      }))
                    : [],
            });
            setInitialStepIdx(0);
            setEditorIsCreate(true);
            setTimeout(() => {
                editorDisclosure.onOpen();
            }, 50);
        },
        [client, context, editorDisclosure]
    );
    const onBeginCreateSessionForExistingExhibition = useCallback(
        (typeDisplayName: string) => {
            setAddSessionForExhibitionTypeDisplayName(typeDisplayName);
            setAddSessionOrPresentation("session");
            setAddForExistingExhibitionSession(null);
            addSessionForExhibitionDisclosure.onOpen();
        },
        [addSessionForExhibitionDisclosure]
    );
    const onDoCreateSessionForExistingExhibition = useCallback(
        async (exhibitionId: string, session: ManageSchedule_SessionFragment | null) => {
            const itemResponse = await client
                .query<ManageSchedule_GetExistingExhibitionQuery, ManageSchedule_GetExistingExhibitionQueryVariables>(
                    ManageSchedule_GetExistingExhibitionDocument,
                    {
                        id: exhibitionId,
                    },
                    context
                )
                .toPromise();

            const exhibition = itemResponse.data?.collection_Exhibition_by_pk;
            const item = exhibition?.descriptiveItem;
            setCurrentRecord({
                exhibitionId,
                name: item
                    ? item?.typeName === Content_ItemType_Enum.Sponsor
                        ? item.title + " - Sponsored session"
                        : item.title
                    : undefined,
                item:
                    item?.typeName === Content_ItemType_Enum.Sponsor
                        ? item
                            ? {
                                  title: item.title + " - Sponsored session",
                                  typeName: Content_ItemType_Enum.Session,
                                  itemPeople: item.itemPeople.map((person) => ({
                                      personId: person.personId,
                                      priority: person.priority,
                                      roleName: person.roleName,
                                  })),
                                  itemTags: item.itemTags.map((tag) => ({
                                      tagId: tag.tagId,
                                  })),
                              }
                            : undefined
                        : item,
                sessionEventId: session?.id,
                roomId:
                    session?.roomId ?? (item?.typeName === Content_ItemType_Enum.Sponsor ? item.room?.id : undefined),
                eventPeople: item
                    ? item.itemPeople.map((x) => ({
                          personId: x.personId,
                          roleName: mapItemPersonRoleToEventPersonRole(x.roleName),
                      }))
                    : [],
            });
            setInitialStepIdx(0);
            setEditorIsCreate(true);
            setTimeout(() => {
                editorDisclosure.onOpen();
            }, 50);
        },
        [client, context, editorDisclosure]
    );
    const onEditSession = useCallback(
        (session: DeepPartial<ManageSchedule_SessionFragment>, initialStepIdx = 0) => {
            setCurrentRecord(session);
            setInitialStepIdx(initialStepIdx);
            setEditorIsCreate(false);
            setTimeout(() => {
                editorDisclosure.onOpen();
            }, 50);
        },
        [editorDisclosure]
    );
    const onDeleteSessions = useCallback(
        (ids: string[]) => {
            setDeleteEventType("session");
            setDeleteEventIds(ids);
            deleteEventsDisclosure.onOpen();
        },
        [deleteEventsDisclosure]
    );
    const onShiftSessions = useCallback(
        (ids: string[]) => {
            setShiftEventIds(ids);
            shiftEventsDisclosure.onOpen();
        },
        [shiftEventsDisclosure]
    );
    const onExportSessions = useCallback((_ids: string[]) => {
        // TODO:
    }, []);
    const headerControls = HeaderControls(
        onCreateSession,
        onBeginCreateSessionForExistingContent,
        onBeginCreateSessionForExistingExhibition
    );

    const onCreatePresentation = useCallback(
        (session: ManageSchedule_SessionFragment) => {
            setCurrentRecord({
                sessionEventId: session.id,
                roomId: session.roomId,
                session,
            });
            setInitialStepIdx(0);
            setEditorIsCreate(true);
            setTimeout(() => {
                editorDisclosure.onOpen();
            }, 50);
        },
        [editorDisclosure]
    );
    const onEditPresentation = useCallback(
        (
            session: ManageSchedule_SessionFragment,
            presentation: DeepPartial<ManageSchedule_PresentationFragment>,
            initialStepIdx = 0
        ) => {
            setCurrentRecord({ ...presentation, session });
            setInitialStepIdx(initialStepIdx);
            setEditorIsCreate(false);
            setTimeout(() => {
                editorDisclosure.onOpen();
            }, 50);
        },
        [editorDisclosure]
    );
    const onDeletePresentations = useCallback(
        (ids: string[]) => {
            setDeleteEventType("presentation");
            setDeleteEventIds(ids);
            deleteEventsDisclosure.onOpen();
        },
        [deleteEventsDisclosure]
    );

    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [searchName, setSearchName] = useState<string>("");
    const [startAfter, setStartAfter] = useState<Date | undefined>(undefined);
    const [limit, setLimit] = useRestorableState<number>(
        `${conference.id}-ManageScheduleV2-ItemsPerPage`,
        10,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );
    const [offset, setOffset] = useState<number>(0);
    const [offsetStr, setOffsetStr] = useState<string>("0");
    useEffect(() => {
        setOffsetStr(Math.ceil(1 + offset / limit).toString());
    }, [limit, offset]);

    const [filter, setFilter] = useState<Schedule_Event_Bool_Exp>({});
    useEffect(() => {
        const tId = setTimeout(
            () =>
                setFilter({
                    ...(searchName.length >= 3
                        ? {
                              _or: [
                                  { name: { _ilike: "%" + searchName + "%" } },
                                  { item: { title: { _ilike: "%" + searchName + "%" } } },
                              ],
                          }
                        : {}),
                    ...(startAfter ? { scheduledStartTime: { _gte: startAfter.toISOString() } } : {}),
                }),
            500
        );
        return () => {
            clearTimeout(tId);
        };
    }, [searchName, startAfter]);
    const [sessionsResponse, refetchSessions] = useManageSchedule_GetSessionsPageQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
            limit,
            offset,
            filter,
        },
        context,
        requestPolicy: "cache-and-network",
    });
    const [tagsResponse] = useManageSchedule_GetTagsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
        requestPolicy: "cache-and-network",
    });
    const tags = useMemo(() => tagsResponse.data?.collection_Tag ?? [], [tagsResponse.data?.collection_Tag]);
    const actualError = useMemo(() => extractActualError(sessionsResponse.error), [sessionsResponse.error]);

    const [selectedSessions, setSelectedSessions] = useState<ReadonlySet<string>>(new Set());
    const sessionCount = sessionsResponse.data?.schedule_Event.length ?? 0;

    const pageBgColour = useColorModeValue("AppPage.pageBackground-light", "AppPage.pageBackground-dark");
    const inputBgColour = useColorModeValue("white", "#111");
    const bulkButtonBgColour = useColorModeValue("white", "#111");

    const refetchPresentations = useMemo(
        () =>
            new Map(
                sessionsResponse.data?.schedule_Event.map((x) => [
                    x.id as string,
                    React.createRef<(() => void) | null>(),
                ]) ?? []
            ),
        [sessionsResponse.data?.schedule_Event]
    );

    return (
        <DashboardPage
            title="Schedule"
            controls={headerControls}
            autoOverflow={false}
            stickyHeader={selectedSessions.size === 0}
        >
            <VStack spacing={0} justifyContent="flex-start" alignItems="flex-start" maxW="800px">
                <HStack
                    spacing={4}
                    w="100%"
                    maxW="100%"
                    justifyContent="flex-start"
                    alignItems="flex-end"
                    minH="5em"
                    pos={selectedSessions.size > 0 ? "sticky" : undefined}
                    top={0}
                    bgColor={pageBgColour}
                    zIndex={10000}
                    pb={4}
                >
                    <HStack spacing={2} pr={2}>
                        <SelectButton
                            aria-label={
                                selectedSessions.size === sessionCount
                                    ? `${selectedSessions.size} out of ${sessionCount} selected. Deselect all`
                                    : `${selectedSessions.size} out of ${sessionCount} selected. Select all`
                            }
                            isSelected={selectedSessions.size === sessionCount}
                            isIndeterminate={selectedSessions.size > 0 && selectedSessions.size !== sessionCount}
                            onToggle={() => {
                                if (selectedSessions.size === sessionCount) {
                                    setSelectedSessions(new Set());
                                } else {
                                    setSelectedSessions(
                                        new Set(sessionsResponse.data?.schedule_Event.map((x) => x.id) ?? [])
                                    );
                                }
                            }}
                            colorScheme="blue"
                            m="3px"
                            bgColor={inputBgColour}
                        />
                        {selectedSessions.size > 0 ? (
                            <chakra.span flex="0 0 max-content" whiteSpace="nowrap" fontSize="lg" fontWeight="bold">
                                {selectedSessions.size} / {sessionCount}
                            </chakra.span>
                        ) : undefined}
                    </HStack>
                    <Spacer />
                    {selectedSessions.size === 0 ? (
                        <>
                            <FormControl id="search-title" maxW="600px">
                                <FormLabel color="gray.500" mb={0}>
                                    Search events
                                </FormLabel>
                                <Input
                                    type="text"
                                    placeholder="Start typing"
                                    bgColor={inputBgColour}
                                    value={searchName}
                                    onChange={(ev) => {
                                        setSearchName(ev.target.value);
                                    }}
                                />
                            </FormControl>
                            <FormControl id="search-time" flex="0 0 max-content">
                                <FormLabel color="gray.500" mb={0}>
                                    Start after
                                </FormLabel>
                                <DateTimePicker
                                    allowUndefined
                                    bgColor={inputBgColour}
                                    value={startAfter}
                                    onChange={setStartAfter}
                                />
                            </FormControl>
                        </>
                    ) : (
                        <HStack justifyContent="flex-end" spacing={2}>
                            {/* <Button
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                    // TODO:
                                }}
                                borderRadius="xl"
                                bgColor={bulkButtonBgColour}
                                fontWeight="400"
                            >
                                Add people
                            </Button> */}
                            {/* <Button
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                    // TODO:
                                }}
                                borderRadius="xl"
                                bgColor={bulkButtonBgColour}
                                fontWeight="400"
                            >
                                Manage tags
                            </Button> */}
                            <Button
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                    onShiftSessions([...selectedSessions]);
                                }}
                                borderRadius="xl"
                                bgColor={bulkButtonBgColour}
                                fontWeight="400"
                            >
                                Shift times
                            </Button>
                            {/* <Button
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                    onExportSessions([...selectedSessions]);
                                }}
                                borderRadius="xl"
                                bgColor={bulkButtonBgColour}
                                fontWeight="400"
                            >
                                Export
                            </Button> */}
                            <Button
                                colorScheme="DestructiveActionButton"
                                variant="outline"
                                onClick={() => {
                                    onDeleteSessions([...selectedSessions]);
                                }}
                                borderRadius="xl"
                                bgColor={bulkButtonBgColour}
                                fontWeight="400"
                            >
                                Delete
                            </Button>
                        </HStack>
                    )}
                </HStack>
                <VStack spacing={4} justifyContent="flex-start" alignItems="flex-start" w="100%">
                    {/* {selectedSessions.size === 0 ? (
                        <PaginationControls
                            setOffset={setOffset}
                            limit={limit}
                            setSelectedSessions={setSelectedSessions}
                            offset={offset}
                            offsetStr={offsetStr}
                            setOffsetStr={setOffsetStr}
                            sessionsResponse={sessionsResponse}
                        />
                    ) : undefined} */}
                    {actualError ? (
                        <Alert status="error">
                            <HStack>
                                <AlertIcon />
                                <AlertTitle>Error loading sessions</AlertTitle>
                            </HStack>
                            <AlertDescription>{actualError}</AlertDescription>
                        </Alert>
                    ) : undefined}
                    {sessionsResponse.fetching ? (
                        <Spinner size="lg" />
                    ) : (
                        sessionsResponse.data?.schedule_Event.map((session, idx) => {
                            const previous = sessionsResponse.data?.schedule_Event[idx - 1];
                            const previousStart = previous?.scheduledStartTime
                                ? new Date(previous.scheduledStartTime)
                                : undefined;
                            const thisStart = session.scheduledStartTime
                                ? new Date(session.scheduledStartTime)
                                : undefined;
                            const dateChanged =
                                idx === 0 ||
                                (previousStart &&
                                    thisStart &&
                                    (previousStart.getDate() !== thisStart.getDate() ||
                                        previousStart.getMonth() !== thisStart.getMonth() ||
                                        previousStart.getFullYear() !== thisStart.getFullYear()));

                            const card = (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    anySelected={selectedSessions.size > 0}
                                    isSelected={selectedSessions.has(session.id)}
                                    onSelectToggle={() => {
                                        setSelectedSessions((old) => {
                                            const newSet = new Set(old);
                                            if (old.has(session.id)) {
                                                newSet.delete(session.id);
                                            } else {
                                                newSet.add(session.id);
                                            }
                                            return newSet;
                                        });
                                    }}
                                    onEdit={(idx) => onEditSession(session, idx)}
                                    onDelete={() => onDeleteSessions([session.id])}
                                    onExport={() => onExportSessions([session.id])}
                                    tags={tags}
                                    onCreatePresentation={() => onCreatePresentation(session)}
                                    onCreatePresentationForExistingContent={(...args) =>
                                        onBeginCreatePresentationForExistingContent(session, ...args)
                                    }
                                    onEditPresentation={(...args) => onEditPresentation(session, ...args)}
                                    onDeletePresentation={(id) => onDeletePresentations([id])}
                                    refetchPresentations={refetchPresentations.get(session.id)}
                                />
                            );
                            return dateChanged ? (
                                <Fragment key={session.id}>
                                    <Heading as="h2" fontSize="md">
                                        {thisStart?.toLocaleDateString(undefined, {
                                            day: "numeric",
                                            month: "short",
                                        })}
                                        {thisStart &&
                                        ((previousStart && thisStart.getFullYear() !== previousStart.getFullYear()) ||
                                            (idx === 0 && thisStart.getFullYear() !== new Date().getFullYear()))
                                            ? " " + thisStart.getFullYear()
                                            : undefined}
                                    </Heading>
                                    {card}
                                </Fragment>
                            ) : (
                                card
                            );
                        })
                    )}
                </VStack>
            </VStack>
            {selectedSessions.size === 0 ? (
                <PaginationControls
                    setOffset={setOffset}
                    setLimit={setLimit}
                    limit={limit}
                    setSelectedSessions={setSelectedSessions}
                    offset={offset}
                    offsetStr={offsetStr}
                    setOffsetStr={setOffsetStr}
                    sessionsResponse={sessionsResponse}
                />
            ) : undefined}
            <Editor<ScheduleEditorRecord>
                isOpen={editorDisclosure.isOpen}
                onClose={editorDisclosure.onClose}
                isCreate={editorIsCreate}
                recordTypeName={
                    currentRecord && "sessionEventId" in currentRecord && currentRecord.sessionEventId
                        ? "Presentation"
                        : "Session"
                }
                steps={[
                    {
                        name: "Details",
                        panel: DetailsPanel,
                    },
                    {
                        name: "People",
                        panel: PeoplePanel,
                    },
                    {
                        name: "Content",
                        panel: ContentPanel,
                    },
                    {
                        name: "Settings",
                        panel: SettingsPanel,
                    },
                ]}
                initialStepIdx={initialStepIdx}
                initialRecord={currentRecord}
                isSaving={isSaving}
                onSave={async (record) => {
                    setIsSaving(true);
                    try {
                        if (record.scheduledStartTime || record.scheduledEndTime) {
                            const overlapsResponse = await client
                                .query<
                                    ManageSchedule_GetPotentiallyOverlappingEventsQuery,
                                    ManageSchedule_GetPotentiallyOverlappingEventsQueryVariables
                                >(
                                    ManageSchedule_GetPotentiallyOverlappingEventsDocument,
                                    {
                                        roomId: record.roomId,
                                        sessionCond:
                                            "sessionEventId" in record && record.sessionEventId
                                                ? {
                                                      _eq: record.sessionEventId,
                                                  }
                                                : {
                                                      _is_null: true,
                                                  },
                                        startBefore: record.scheduledEndTime,
                                        endAfter: record.scheduledStartTime,
                                        excludeId: record.id ?? NIL_UUID,
                                    },
                                    {
                                        ...makeContext({
                                            [AuthHeader.Role]: subconferenceId
                                                ? HasuraRoleName.SubconferenceOrganizer
                                                : HasuraRoleName.ConferenceOrganizer,
                                        }),
                                        requestPolicy: "network-only",
                                    }
                                )
                                .toPromise();
                            if (overlapsResponse.error) {
                                return {
                                    error:
                                        extractActualError(overlapsResponse.error) ??
                                        "Unknown error while checking for overlapping events.",
                                };
                            }
                            if (overlapsResponse.data?.schedule_Event_aggregate.aggregate?.count) {
                                return {
                                    error:
                                        "sessionEventId" in record && record.sessionEventId
                                            ? "Presentations within a session cannot overlap. Consider using unscheduled presentations."
                                            : "Sessions in a room cannot overlap.",
                                };
                            }
                        }

                        let itemId: string | undefined = record.itemId;

                        if (record.item) {
                            const itemRecord = record.item;

                            const newElements = record.elements?.filter((x) => !x.id) ?? [];
                            const updatedElements = record.elements?.filter((x) => x.id) ?? [];
                            const deletedElementIds = record.deletedElementIds ? [...record.deletedElementIds] : [];

                            if (itemRecord.abstract?.length) {
                                const abstractRecord: DeepPartial<ManageSchedule_ElementFragment> = {
                                    ...itemRecord.abstract[0],

                                    isHidden: false,
                                    typeName: Content_ElementType_Enum.Abstract,
                                    name: "Abstract",
                                    uploadsRemaining: 0,
                                };
                                if (abstractRecord.id) {
                                    updatedElements.push(abstractRecord);
                                } else {
                                    newElements.push(abstractRecord);
                                }
                            }

                            if (itemRecord.externalEventLink?.length) {
                                const externalEventLinkRecord = {
                                    ...itemRecord.externalEventLink[0],

                                    isHidden: true,
                                    typeName: Content_ElementType_Enum.ExternalEventLink,
                                    uploadsRemaining: 0,
                                };
                                if (externalEventLinkRecord.id) {
                                    updatedElements.push(externalEventLinkRecord);
                                } else {
                                    newElements.push(externalEventLinkRecord);
                                }
                            }

                            if (itemRecord.id) {
                                itemId = itemRecord.id;

                                {
                                    const result = await client
                                        .mutation<
                                            ManageSchedule_UpdateItemMutation,
                                            ManageSchedule_UpdateItemMutationVariables
                                        >(
                                            ManageSchedule_UpdateItemDocument,
                                            {
                                                id: itemRecord.id,
                                                item: {
                                                    title: itemRecord.title,
                                                    typeName: itemRecord.typeName,
                                                },
                                                itemPeople:
                                                    itemRecord.itemPeople?.map((x) => ({
                                                        itemId: itemRecord.id,
                                                        personId: x.personId,
                                                        priority: x.priority,
                                                        roleName: x.roleName,
                                                    })) ?? [],
                                                itemPersonIds:
                                                    (itemRecord.itemPeople
                                                        ?.filter((x) => Boolean(x.personId))
                                                        .map((x) => x.personId) as string[] | undefined) ?? [],
                                                itemTags:
                                                    itemRecord.itemTags?.map((x) => ({
                                                        itemId: itemRecord.id,
                                                        tagId: x.tagId,
                                                    })) ?? [],
                                                itemTagIds:
                                                    (itemRecord.itemTags
                                                        ?.filter((x) => Boolean(x.tagId))
                                                        .map((x) => x.tagId) as string[] | undefined) ?? [],
                                                newElements: newElements.map((x) => ({
                                                    itemId: itemRecord.id,
                                                    conferenceId: conference.id,
                                                    subconferenceId,
                                                    data: x.data,
                                                    layoutData: x.layoutData,
                                                    isHidden: x.isHidden ?? false,
                                                    name: x.name,
                                                    typeName: x.typeName,
                                                    uploadsRemaining: x.uploadsRemaining ?? 0,
                                                })),
                                                deletedElementIds,
                                            },
                                            makeContext({
                                                [AuthHeader.Role]: subconferenceId
                                                    ? HasuraRoleName.SubconferenceOrganizer
                                                    : HasuraRoleName.ConferenceOrganizer,
                                            })
                                        )
                                        .toPromise();

                                    if (result.error) {
                                        return {
                                            error:
                                                extractActualError(result.error) ??
                                                "Unknown error while updating the event content.",
                                        };
                                    }
                                    if (!result.data?.update_content_Item_by_pk?.id) {
                                        return { error: "Event content not updated for unknown reason." };
                                    }
                                }

                                const elementStates = await Promise.all<ValidationState>(
                                    updatedElements.map(async (elementRecord) => {
                                        const result = await client
                                            .mutation<
                                                ManageSchedule_UpdateElementMutation,
                                                ManageSchedule_UpdateElementMutationVariables
                                            >(
                                                ManageSchedule_UpdateElementDocument,
                                                {
                                                    id: elementRecord.id,
                                                    element: {
                                                        data: elementRecord.data,
                                                        isHidden: elementRecord.isHidden,
                                                        layoutData: elementRecord.layoutData,
                                                        name: elementRecord.name,
                                                        typeName: elementRecord.typeName,
                                                        uploadsRemaining: elementRecord.uploadsRemaining,
                                                    },
                                                },
                                                makeContext({
                                                    [AuthHeader.Role]: subconferenceId
                                                        ? HasuraRoleName.SubconferenceOrganizer
                                                        : HasuraRoleName.ConferenceOrganizer,
                                                })
                                            )
                                            .toPromise();

                                        if (result.error) {
                                            return {
                                                error:
                                                    extractActualError(result.error) ??
                                                    "Unknown error while updating the event content element.",
                                            };
                                        }
                                        if (!result.data?.update_content_Element_by_pk?.id) {
                                            return { error: "Event content element not updated for unknown reason." };
                                        }
                                        return "no error";
                                    })
                                );
                                const anyElementUpdateErrors = elementStates.some((x) => x !== "no error");
                                if (anyElementUpdateErrors) {
                                    return {
                                        error: `One or more elements failed to update:
${elementStates.map((st, idx) => `[${idx}] ${st === "no error" ? "No error" : st.error}`)}
`,
                                    };
                                }
                            } else {
                                const result = await client
                                    .mutation<
                                        ManageSchedule_InsertItemMutation,
                                        ManageSchedule_InsertItemMutationVariables
                                    >(
                                        ManageSchedule_InsertItemDocument,
                                        {
                                            object: {
                                                conferenceId: conference.id,
                                                subconferenceId,

                                                title: itemRecord.title,
                                                typeName:
                                                    record.item.typeName ??
                                                    ("sessionEventId" in record && record.sessionEventId
                                                        ? Content_ItemType_Enum.Presentation
                                                        : Content_ItemType_Enum.Session),

                                                itemTags: record.item.itemTags
                                                    ? {
                                                          data: record.item.itemTags.map((x) => ({
                                                              tagId: x.tagId,
                                                          })),
                                                      }
                                                    : undefined,
                                                itemPeople: record.item.itemPeople
                                                    ? {
                                                          data: record.item.itemPeople.map((x) => ({
                                                              personId: x.personId,
                                                              priority: x.priority,
                                                              roleName: x.roleName,
                                                          })),
                                                      }
                                                    : undefined,

                                                elements: {
                                                    data: [...newElements, ...updatedElements].map((elementRecord) => ({
                                                        conferenceId: conference.id,
                                                        subconferenceId,
                                                        data: elementRecord.data,
                                                        isHidden: elementRecord.isHidden,
                                                        layoutData: elementRecord.layoutData,
                                                        name: elementRecord.name,
                                                        typeName: elementRecord.typeName,
                                                        uploadsRemaining: elementRecord.uploadsRemaining,
                                                    })),
                                                },
                                            },
                                        },
                                        makeContext({
                                            [AuthHeader.Role]: subconferenceId
                                                ? HasuraRoleName.SubconferenceOrganizer
                                                : HasuraRoleName.ConferenceOrganizer,
                                        })
                                    )
                                    .toPromise();

                                if (result.error) {
                                    return {
                                        error:
                                            extractActualError(result.error) ??
                                            "Unknown error while updating the event content.",
                                    };
                                }
                                if (!result.data?.insert_content_Item_one?.id) {
                                    return { error: "Event content not inserted for unknown reason." };
                                }

                                itemId = result.data.insert_content_Item_one.id;
                            }
                        }

                        if (record.id) {
                            let shiftPresentationsByMinutes = 0;
                            if (!("sessionEventId" in record && record.sessionEventId)) {
                                const originalEvent = sessionsResponse.data?.schedule_Event.find(
                                    (x) => x.id === record.id
                                );
                                if (!originalEvent) {
                                    return { error: "Could not find original session to check time shift." };
                                }
                                if (record.scheduledStartTime && originalEvent.scheduledStartTime) {
                                    shiftPresentationsByMinutes = Math.round(
                                        (Date.parse(record.scheduledStartTime) -
                                            Date.parse(originalEvent.scheduledStartTime)) /
                                            (60 * 1000)
                                    );
                                }
                            }

                            const result = await client
                                .mutation<
                                    ManageSchedule_UpdateEventMutation,
                                    ManageSchedule_UpdateEventMutationVariables
                                >(
                                    ManageSchedule_UpdateEventDocument,
                                    {
                                        id: record.id,
                                        roomId: record.roomId,
                                        event: {
                                            name: record.name,
                                            scheduledStartTime: record.scheduledStartTime,
                                            scheduledEndTime: record.scheduledEndTime,
                                            modeName: "modeName" in record ? record.modeName : undefined,
                                            roomId: record.roomId,
                                            itemId,
                                            exhibitionId: "exhibitionId" in record ? record.exhibitionId : undefined,
                                            shufflePeriodId:
                                                "shufflePeriodId" in record ? record.shufflePeriodId : undefined,

                                            enableRecording:
                                                "enableRecording" in record ? record.enableRecording : undefined,
                                            autoPlayElementId:
                                                "autoPlayElementId" in record ? record.autoPlayElementId : undefined,
                                            streamTextEventId:
                                                "streamTextEventId" in record ? record.streamTextEventId : undefined,
                                            automaticParticipationSurvey:
                                                "automaticParticipationSurvey" in record
                                                    ? record.automaticParticipationSurvey
                                                    : undefined,
                                        },
                                        eventPeople:
                                            record.eventPeople?.map((x) => ({
                                                eventId: record.id,
                                                roleName: x.roleName,
                                                personId: x.personId,
                                            })) ?? [],
                                        eventPersonIds:
                                            record.eventPeople?.filter((x) => x.personId).map((x) => x.personId) ?? [],
                                        shiftPresentationsByMinutes,
                                    },
                                    makeContext({
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    })
                                )
                                .toPromise();

                            if (result.error) {
                                return {
                                    error:
                                        extractActualError(result.error) ?? "Unknown error while inserting the event.",
                                };
                            }
                            if (!result.data?.update_schedule_Event_by_pk) {
                                return { error: "Event not updated for unknown reason." };
                            }

                            if ("sessionEventId" in record && record.sessionEventId) {
                                refetchPresentations.get(record.sessionEventId)?.current?.();
                            } else {
                                refetchSessions();
                            }
                        } else {
                            const result = await client
                                .mutation<
                                    ManageSchedule_InsertEventMutation,
                                    ManageSchedule_InsertEventMutationVariables
                                >(
                                    ManageSchedule_InsertEventDocument,
                                    {
                                        object: {
                                            id: record.id,
                                            conferenceId: conference.id,
                                            subconferenceId,
                                            sessionEventId:
                                                "sessionEventId" in record ? record.sessionEventId : undefined,
                                            name: record.name,
                                            scheduledStartTime: record.scheduledStartTime,
                                            scheduledEndTime: record.scheduledEndTime,
                                            modeName: "modeName" in record ? record.modeName : undefined,
                                            roomId: record.roomId,
                                            itemId,
                                            exhibitionId: "exhibitionId" in record ? record.exhibitionId : undefined,
                                            shufflePeriodId:
                                                "shufflePeriodId" in record ? record.shufflePeriodId : undefined,

                                            enableRecording:
                                                "enableRecording" in record ? record.enableRecording : undefined,
                                            autoPlayElementId:
                                                "autoPlayElementId" in record ? record.autoPlayElementId : undefined,
                                            streamTextEventId:
                                                "streamTextEventId" in record ? record.streamTextEventId : undefined,
                                            automaticParticipationSurvey:
                                                "automaticParticipationSurvey" in record
                                                    ? record.automaticParticipationSurvey
                                                    : undefined,

                                            eventPeople: record.eventPeople
                                                ? {
                                                      data: record.eventPeople.map((x) => ({
                                                          id: x.id,
                                                          roleName: x.roleName,
                                                          personId: x.personId,
                                                      })),
                                                  }
                                                : undefined,
                                        },
                                    },
                                    makeContext({
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    })
                                )
                                .toPromise();

                            if (result.error) {
                                return {
                                    error:
                                        extractActualError(result.error) ?? "Unknown error while inserting the event.",
                                };
                            }
                            if (!result.data?.insert_schedule_Event_one) {
                                return { error: "Event not inserted for unknown reason." };
                            }

                            if ("sessionEventId" in record && record.sessionEventId) {
                                refetchPresentations.get(record.sessionEventId)?.current?.();
                            } else {
                                const ordering = await client
                                    .query<
                                        ManageSchedule_GetAllSessionIdsQuery,
                                        ManageSchedule_GetAllSessionIdsQueryVariables
                                    >(
                                        ManageSchedule_GetAllSessionIdsDocument,
                                        {
                                            conferenceId: conference.id,
                                            subconferenceCond: subconferenceId
                                                ? { _eq: subconferenceId }
                                                : { _is_null: true },
                                            filter,
                                        },
                                        makeContext({
                                            [AuthHeader.Role]: subconferenceId
                                                ? HasuraRoleName.SubconferenceOrganizer
                                                : HasuraRoleName.ConferenceOrganizer,
                                        })
                                    )
                                    .toPromise();
                                if (ordering.error) {
                                    return {
                                        error:
                                            extractActualError(ordering.error) ??
                                            "Unknown error retrieving ordering of sessions.",
                                    };
                                }

                                if (!ordering.data) {
                                    return { error: "Unable to retrieve ordering of sessions." };
                                }

                                refetchSessions();

                                const newId = result.data.insert_schedule_Event_one.id;
                                const index = ordering.data.schedule_Event.findIndex((x) => x.id === newId);
                                setOffset(Math.max(0, limit * Math.floor(index / limit)));
                            }
                        }
                    } catch (e: any) {
                        return { error: "Unhandled error: " + e.toString() };
                    } finally {
                        setIsSaving(false);
                    }
                    return "no error";
                }}
            />
            <DeleteModal
                isOpen={deleteEventsDisclosure.isOpen}
                onClose={(didDelete) => {
                    deleteEventsDisclosure.onClose();
                    if (didDelete) {
                        deleteEventIds.forEach((x) => refetchPresentations.get(x)?.current?.());
                        refetchSessions();
                        setSelectedSessions(new Set());
                    }
                }}
                deleteEventIds={deleteEventIds}
                deleteEventType={deleteEventType}
            />
            <ShiftTimesModal
                isOpen={shiftEventsDisclosure.isOpen}
                onClose={(didShift) => {
                    shiftEventsDisclosure.onClose();
                    if (didShift) {
                        shiftEventIds.forEach((x) => refetchPresentations.get(x)?.current?.());
                        refetchSessions();
                    }
                }}
                eventIds={shiftEventIds}
            />
            <FindExistingContentModal
                isOpen={addSessionForContentDisclosure.isOpen}
                onClose={(id) => {
                    if (id) {
                        onDoCreateSessionForExistingContent(id, addForExistingContentSession);
                    }
                    addSessionForContentDisclosure.onClose();
                }}
                sessionOrPresentation={addSessionOrPresentation}
                typeDisplayName={addSessionForContentTypeDisplayName}
                typeNames={addSessionForContentTypeNames}
            />
            <FindExistingExhibitionModal
                isOpen={addSessionForExhibitionDisclosure.isOpen}
                onClose={(id) => {
                    if (id) {
                        onDoCreateSessionForExistingExhibition(id, addForExistingExhibitionSession);
                    }
                    addSessionForExhibitionDisclosure.onClose();
                }}
                sessionOrPresentation={addSessionOrPresentation}
                typeDisplayName={addSessionForExhibitionTypeDisplayName}
            />
        </DashboardPage>
    );
}

function PaginationControls({
    setOffset,
    limit,
    setLimit,
    setSelectedSessions,
    offset,
    offsetStr,
    setOffsetStr,
    sessionsResponse,
}: {
    setOffset: React.Dispatch<React.SetStateAction<number>>;
    limit: number;
    setLimit: React.Dispatch<React.SetStateAction<number>>;
    setSelectedSessions: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>;
    offset: number;
    offsetStr: string;
    setOffsetStr: React.Dispatch<React.SetStateAction<string>>;
    sessionsResponse: UseQueryState<ManageSchedule_GetSessionsPageQuery, object>;
}) {
    return (
        <VStack py={4} spacing={4} w="100%" justifyContent="center" maxW="800px">
            <HStack spacing={4} py={4} w="100%" justifyContent="center">
                <IconButton
                    aria-label="Previous page"
                    icon={<ChevronLeftIcon />}
                    onClick={() => {
                        setOffset((old) => Math.max(0, old - limit));
                        setSelectedSessions(new Set());
                    }}
                    isDisabled={offset === 0}
                />
                <HStack spacing={1}>
                    <Input
                        type="number"
                        size="sm"
                        value={offsetStr}
                        onChange={(ev) => {
                            setOffsetStr(ev.target.value);
                        }}
                        min={1}
                        max={Math.ceil(
                            (sessionsResponse.data?.schedule_Event_aggregate?.aggregate?.count ?? 0) / limit
                        )}
                        onBlur={(ev) => {
                            if (ev.target.checkValidity()) {
                                setOffset((ev.target.valueAsNumber - 1) * limit);
                            }
                        }}
                        onKeyUp={(ev) => {
                            if (ev.key === "Enter" && (ev.target as HTMLInputElement).checkValidity()) {
                                setOffset(((ev.target as HTMLInputElement).valueAsNumber - 1) * limit);
                            }
                        }}
                        isDisabled={!sessionsResponse.data?.schedule_Event_aggregate?.aggregate?.count}
                        minW={0}
                        w="3em"
                    />
                    <chakra.span>of</chakra.span>
                    <chakra.span>
                        {sessionsResponse.data?.schedule_Event_aggregate.aggregate
                            ? Math.ceil(sessionsResponse.data.schedule_Event_aggregate.aggregate.count / limit)
                            : "0"}
                    </chakra.span>
                </HStack>
                <IconButton
                    aria-label="Next page"
                    icon={<ChevronRightIcon />}
                    onClick={() => {
                        setOffset((old) =>
                            sessionsResponse.data?.schedule_Event_aggregate.aggregate
                                ? Math.min(
                                      sessionsResponse.data.schedule_Event_aggregate.aggregate.count -
                                          (sessionsResponse.data.schedule_Event_aggregate.aggregate.count % limit),
                                      old + limit
                                  )
                                : 0
                        );
                        setSelectedSessions(new Set());
                    }}
                    isDisabled={
                        sessionsResponse.data?.schedule_Event_aggregate.aggregate
                            ? offset >= sessionsResponse.data.schedule_Event_aggregate.aggregate.count - limit
                            : true
                    }
                />
            </HStack>
            <HStack spacing={4} py={4} w="100%" justifyContent="center">
                <Select
                    value={limit}
                    onChange={(ev) => {
                        setLimit(parseInt(ev.target.value, 10));
                        setSelectedSessions(new Set());
                    }}
                    size="sm"
                    w="max-content"
                >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="30">30 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                </Select>
            </HStack>
        </VStack>
    );
}
