import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    chakra,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Input,
    Spacer,
    Spinner,
    useColorModeValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ManageSchedule_GetAllSessionIdsQuery,
    ManageSchedule_GetAllSessionIdsQueryVariables,
    ManageSchedule_InsertEventMutation,
    ManageSchedule_InsertEventMutationVariables,
    ManageSchedule_SessionFragment,
    Schedule_Event_Bool_Exp,
} from "../../../../generated/graphql";
import {
    Content_ItemType_Enum,
    ManageSchedule_GetAllSessionIdsDocument,
    ManageSchedule_InsertEventDocument,
    useManageSchedule_GetSessionsPageQuery,
    useManageSchedule_GetTagsQuery,
} from "../../../../generated/graphql";
import SelectButton from "../../../Card/SelectButton";
import Editor from "../../../CRUDCards/Editor";
import type { DeepPartial } from "../../../CRUDCards/Types";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import DetailsPanel from "./Components/DetailsPanel";
import HeaderControls from "./Components/HeaderControls";
import PeoplePanel from "./Components/PeoplePanel";
import SessionCard from "./Components/SessionCard";

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

    fragment ManageSchedule_SessionContent on content_Item {
        id
        title
        typeName
        itemTags {
            ...ManageSchedule_ItemTag
        }
        itemPeople {
            ...ManageSchedule_ItemPerson
        }
        abstract: elements(where: { typeName: { _eq: ABSTRACT } }) {
            id
            data
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

        presentations_aggregate {
            aggregate {
                count
            }
        }

        item {
            ...ManageSchedule_SessionContent
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

    mutation ManageSchedule_DeleteEvents($ids: [uuid!]!) {
        delete_schedule_Event(where: { id: { _in: $ids } }) {
            affected_rows
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
`;

export default function ManageScheduleV2(): JSX.Element {
    const sessionEditorDisclosure = useDisclosure();
    const [sessionEditorIsCreate, setSessionEditorIsCreate] = useState<boolean>(false);
    const deleteSessionsDisclosure = useDisclosure();
    const [deleteSessionIds, setDeleteSessionIds] = useState<string[]>([]);

    const [initialStepIdx, setInitialStepIdx] = useState<number>(0);
    const [currentRecord, setCurrentRecord] = useState<DeepPartial<ManageSchedule_SessionFragment>>({});

    const client = useClient();

    const onCreateSession = useCallback(() => {
        setCurrentRecord({
            // TODO: Settings panel to set default mode name and room id
            // modeName: Schedule_Mode_Enum.VideoChat,
        });
        setInitialStepIdx(0);
        setSessionEditorIsCreate(true);
        setTimeout(() => {
            sessionEditorDisclosure.onOpen();
        }, 50);
    }, [sessionEditorDisclosure]);
    const onEditSession = useCallback(
        (session: DeepPartial<ManageSchedule_SessionFragment>, initialStepIdx = 0) => {
            setCurrentRecord(session);
            setInitialStepIdx(initialStepIdx);
            setSessionEditorIsCreate(false);
            setTimeout(() => {
                sessionEditorDisclosure.onOpen();
            }, 50);
        },
        [sessionEditorDisclosure]
    );
    const deleteSessions = useCallback(
        (ids: string[]) => {
            setDeleteSessionIds(ids);
            deleteSessionsDisclosure.onOpen();
        },
        [deleteSessionsDisclosure]
    );
    const exportSessions = useCallback((_ids: string[]) => {
        // TODO:
    }, []);
    const headerControls = HeaderControls(onCreateSession);

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();

    const [searchName, setSearchName] = useState<string>("");
    const [startAfter, setStartAfter] = useState<Date | undefined>(undefined);
    const [limit, _setLimit] = useState<number>(4);
    const [offset, setOffset] = useState<number>(0);
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
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
    const [sessionsResponse] = useManageSchedule_GetSessionsPageQuery({
        requestPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
            limit,
            offset,
            filter,
        },
        context,
    });
    const [tagsResponse] = useManageSchedule_GetTagsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });
    const tags = useMemo(() => tagsResponse.data?.collection_Tag ?? [], [tagsResponse.data?.collection_Tag]);
    const actualError = useMemo(() => extractActualError(sessionsResponse.error), [sessionsResponse.error]);

    const [selectedSessions, setSelectedSessions] = useState<ReadonlySet<string>>(new Set());
    const sessionCount = sessionsResponse.data?.schedule_Event.length ?? 0;

    const pageBgColour = useColorModeValue("AppPage.pageBackground-light", "AppPage.pageBackground-dark");
    const inputBgColour = useColorModeValue("white", "#111");
    const bulkButtonBgColour = useColorModeValue("white", "#111");

    const deleteSessionsLeastDestructiveActionRef = useRef<HTMLButtonElement | null>(null);
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
                            <Button
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
                            </Button>
                            <Button
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
                            </Button>
                            <Button
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                    // TODO:
                                }}
                                borderRadius="xl"
                                bgColor={bulkButtonBgColour}
                                fontWeight="400"
                            >
                                Shift times
                            </Button>
                            <Button
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                    exportSessions([...selectedSessions]);
                                }}
                                borderRadius="xl"
                                bgColor={bulkButtonBgColour}
                                fontWeight="400"
                            >
                                Export
                            </Button>
                            <Button
                                colorScheme="DestructiveActionButton"
                                variant="outline"
                                onClick={() => {
                                    deleteSessions([...selectedSessions]);
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
                                    onDelete={() => deleteSessions([session.id])}
                                    onExport={() => exportSessions([session.id])}
                                    tags={tags}
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
            <HStack spacing={4} py={4} w="100%" justifyContent="center" maxW="800px">
                <IconButton
                    aria-label="Previous page"
                    icon={<ChevronLeftIcon />}
                    onClick={() => {
                        setOffset((old) => Math.max(0, old - limit));
                        setSelectedSessions(new Set());
                    }}
                    isDisabled={offset === 0}
                />
                <Box>
                    {Math.ceil(1 + offset / limit)} of{" "}
                    {sessionsResponse.data?.schedule_Event_aggregate.aggregate
                        ? Math.ceil(sessionsResponse.data.schedule_Event_aggregate.aggregate.count / limit)
                        : true}
                </Box>
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
            <Editor
                isOpen={sessionEditorDisclosure.isOpen}
                onClose={sessionEditorDisclosure.onClose}
                isCreate={sessionEditorIsCreate}
                recordTypeName="Session"
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
                        panel: (_props) => <>TODO</>,
                    },
                    {
                        name: "Settings",
                        panel: (_props) => <>TODO</>,
                    },
                ]}
                initialStepIdx={initialStepIdx}
                initialRecord={currentRecord}
                isSaving={isSaving}
                onSave={async (record) => {
                    // TODO: Handle edit versus create
                    // TODO: After edit, refetch
                    setIsSaving(true);
                    try {
                        const result = await client
                            .mutation<ManageSchedule_InsertEventMutation, ManageSchedule_InsertEventMutationVariables>(
                                ManageSchedule_InsertEventDocument,
                                {
                                    object: {
                                        // TODO: Other fields
                                        ...record,
                                        conferenceId: conference.id,
                                        subconferenceId,
                                        eventPeople: record.eventPeople
                                            ? {
                                                  data: record.eventPeople,
                                              }
                                            : undefined,
                                        item: record.item
                                            ? {
                                                  data: {
                                                      ...record.item,
                                                      conferenceId: conference.id,
                                                      subconferenceId,
                                                      typeName: Content_ItemType_Enum.Session,
                                                      itemTags: record.item.itemTags
                                                          ? {
                                                                data: record.item.itemTags,
                                                            }
                                                          : undefined,
                                                      itemPeople: record.item.itemPeople
                                                          ? {
                                                                data: record.item.itemPeople,
                                                            }
                                                          : undefined,
                                                  },
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
                                error: extractActualError(result.error) ?? "Unknown error while inserting the session.",
                            };
                        }
                        if (!result.data?.insert_schedule_Event_one) {
                            return { error: "Session not inserted for unknown reason." };
                        }

                        const ordering = await client
                            .query<ManageSchedule_GetAllSessionIdsQuery, ManageSchedule_GetAllSessionIdsQueryVariables>(
                                ManageSchedule_GetAllSessionIdsDocument,
                                {
                                    conferenceId: conference.id,
                                    subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
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

                        const newId = result.data.insert_schedule_Event_one.id;
                        const index = ordering.data.schedule_Event.findIndex((x) => x.id === newId);
                        setOffset(Math.max(0, Math.floor(index / limit)));
                    } finally {
                        setIsSaving(false);
                    }
                    return "no error";
                }}
            />
            <AlertDialog
                isOpen={deleteSessionsDisclosure.isOpen}
                onClose={deleteSessionsDisclosure.onClose}
                leastDestructiveRef={deleteSessionsLeastDestructiveActionRef}
                size="xl"
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Delete {deleteSessionIds.length} sessions?</AlertDialogHeader>
                    <AlertDialogCloseButton />
                    <AlertDialogBody>This cannot be undone.</AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup>
                            <Button
                                ref={deleteSessionsLeastDestructiveActionRef}
                                colorScheme="blue"
                                variant="outline"
                                onClick={deleteSessionsDisclosure.onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme="DestructiveActionButton"
                                variant="outline"
                                onClick={() => {
                                    // TODO:
                                }}
                            >
                                Delete sessions and content
                            </Button>
                            <Button
                                colorScheme="DestructiveActionButton"
                                variant="outline"
                                onClick={() => {
                                    // TODO:
                                }}
                            >
                                Delete events only
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardPage>
    );
}
