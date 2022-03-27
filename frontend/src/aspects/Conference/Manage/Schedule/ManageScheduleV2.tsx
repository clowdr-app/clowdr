import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    chakra,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Input,
    Spacer,
    Spinner,
    Tag,
    Text,
    useColorModeValue,
    useDisclosure,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { ElementDataBlob, TextualElementBlob } from "@midspace/shared-types/content";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ManageSchedule_GetAllSessionIdsQuery,
    ManageSchedule_GetAllSessionIdsQueryVariables,
    ManageSchedule_InsertEventMutation,
    ManageSchedule_InsertEventMutationVariables,
    ManageSchedule_ItemTagFragment,
    ManageSchedule_SessionFragment,
    ManageSchedule_TagFragment,
    Schedule_Event_Bool_Exp,
} from "../../../../generated/graphql";
import {
    Content_ItemType_Enum,
    ManageSchedule_GetAllSessionIdsDocument,
    ManageSchedule_InsertEventDocument,
    Schedule_Mode_Enum,
    useManageSchedule_GetSessionsPageQuery,
    useManageSchedule_GetTagsQuery,
} from "../../../../generated/graphql";
import Card from "../../../Card";
import SelectButton from "../../../Card/SelectButton";
import Editor from "../../../CRUDCards/Editor";
import type { DeepPartial } from "../../../CRUDCards/Types";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
import { maybeCompare } from "../../../Utils/maybeCompare";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import DetailsPanel from "./Components/DetailsPanel";
import HeaderControls from "./Components/HeaderControls";
import PeoplePanel from "./Components/PeoplePanel";

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
`;

export default function ManageScheduleV2(): JSX.Element {
    const sessionEditorDisclosure = useDisclosure();
    const [sessionEditorIsCreate, setSessionEditorIsCreate] = useState<boolean>(false);

    const [initialStepIdx, setInitialStepIdx] = useState<number>(0);
    const [currentRecord, setCurrentRecord] = useState<DeepPartial<ManageSchedule_SessionFragment>>({});

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

    const client = useClient();

    const pageBgColour = useColorModeValue("AppPage.pageBackground-light", "AppPage.pageBackground-dark");

    return (
        <DashboardPage
            title="Schedule"
            controls={headerControls}
            autoOverflow={false}
            stickyHeader={selectedSessions.size === 0}
        >
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
                        setOffset(Math.floor(index / limit));
                    } finally {
                        setIsSaving(false);
                    }
                    return "no error";
                }}
            />
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
                                    bgColor="white"
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
                                    bgColor="white"
                                    value={startAfter}
                                    onChange={setStartAfter}
                                />
                            </FormControl>
                        </>
                    ) : (
                        <>Bulk controls</>
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
                        sessionsResponse.data?.schedule_Event.map((session) => (
                            <SessionCard
                                key={session.id}
                                session={session}
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
                                tags={tags}
                            />
                        ))
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
                                ? Math.max(
                                      sessionsResponse.data.schedule_Event_aggregate.aggregate.count - limit,
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
        </DashboardPage>
    );
}

function SessionCard({
    session,
    tags,

    isSelected,
    isDisabled,
    onSelectToggle,
}: {
    session: ManageSchedule_SessionFragment;
    tags: ReadonlyArray<ManageSchedule_TagFragment>;

    isSelected: boolean;
    isDisabled?: boolean;
    onSelectToggle: () => void;
}): JSX.Element {
    const ref = useRef<HTMLDivElement | null>(null);
    const start = useMemo(() => new Date(session.scheduledStartTime), [session.scheduledStartTime]);
    const end = useMemo(() => new Date(session.scheduledEndTime), [session.scheduledEndTime]);
    const duration = useMemo(() => Math.round((end.getTime() - start.getTime()) / (60 * 1000)), [end, start]);
    const presentationsDisclosure = useDisclosure();

    const abstractData: TextualElementBlob | undefined = useMemo(
        () => (session.item?.abstract?.[0]?.data as ElementDataBlob | undefined)?.[0]?.data as TextualElementBlob,
        [session.item?.abstract]
    );
    const peopleCount = session.eventPeople.length + (session.item?.itemPeople.length ?? 0);
    const elementCount = session.item?.elements_aggregate.aggregate?.count ?? 0;
    return (
        <VStack minW="400px" w="100%" alignItems="flex-start">
            <Card
                ref={ref}
                isSelectable
                isSelected={isSelected}
                isDisabled={isDisabled}
                onSelectToggle={() => {
                    onSelectToggle();
                }}
                subHeading={
                    start.toLocaleString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    }) +
                    " - " +
                    new Date(start.getTime() + 1000 * 60 * duration).toLocaleString(undefined, {
                        hour: "numeric",
                        minute: "numeric",
                    }) +
                    ` (${
                        duration >= 60
                            ? Math.floor(duration / 60).toFixed(0) +
                              " hr" +
                              (duration >= 120 ? "s" : "") +
                              (duration % 60 !== 0 ? " " : "")
                            : ""
                    }${duration % 60 !== 0 ? (duration % 60) + " mins" : ""})`
                }
                heading={session.item?.title ?? session.name}
                w="100%"
                bottomButton={
                    session.modeName &&
                    (session.modeName === Schedule_Mode_Enum.VideoChat ||
                        session.modeName === Schedule_Mode_Enum.Livestream ||
                        session.modeName === Schedule_Mode_Enum.External)
                        ? {
                              label: session.presentations_aggregate.aggregate?.count
                                  ? "Presentations"
                                  : presentationsDisclosure.isOpen
                                  ? "Cancel"
                                  : "Add presentation",
                              colorScheme: "blue",
                              icon: session.presentations_aggregate.aggregate?.count
                                  ? presentationsDisclosure.isOpen
                                      ? "chevron-up"
                                      : "chevron-down"
                                  : presentationsDisclosure.isOpen
                                  ? "times"
                                  : "plus",
                              iconStyle: "s",
                              onClick: () => {
                                  if (!isDisabled) {
                                      presentationsDisclosure.onToggle();
                                  }
                              },
                              variant: "ghost",
                              showLabel: true,
                          }
                        : undefined
                }
                editControls={[]}
            >
                {abstractData ? <Text noOfLines={3}>{abstractData.text}</Text> : undefined}
                <HStack w="100%" alignItems="flex-start">
                    {session.item?.itemTags.length ? <Tags tags={tags} itemTags={session.item.itemTags} /> : undefined}
                    <Spacer />
                    {session.modeName && session.modeName !== Schedule_Mode_Enum.VideoChat ? (
                        <Tag
                            borderRadius="full"
                            colorScheme="purple"
                            minW="max-content"
                            whiteSpace="nowrap"
                            overflow="hidden"
                        >
                            {session.modeName}
                        </Tag>
                    ) : undefined}
                    <Tag
                        colorScheme="blue"
                        variant="subtle"
                        borderRadius="full"
                        minW="max-content"
                        whiteSpace="nowrap"
                        overflow="hidden"
                    >
                        {peopleCount > 0 ? `${peopleCount} ${peopleCount === 1 ? "person" : "people"}` : "Add people"}
                    </Tag>
                    <Tag
                        colorScheme="yellow"
                        variant="subtle"
                        borderRadius="full"
                        minW="max-content"
                        whiteSpace="nowrap"
                        overflow="hidden"
                    >
                        {elementCount > 0 ? `Content: ${elementCount}` : "Add content"}
                    </Tag>
                </HStack>
            </Card>
            {/* {isSelected ? (
                <VStack pl={8} alignItems="flex-start" w="100%" zIndex={1} spacing={4}>
                    <Heading as="h4" fontSize="sm" pt={2}>
                        Presentations
                    </Heading>
                    {session.presentations.length === 0 ? (
                        <Text>No presentations</Text>
                    ) : (
                        session.presentations.map((presentation, idx) => (
                            <PresentationCard
                                key={"presentation-" + idx}
                                presentation={presentation}
                                isSelected={
                                    selection !== "session" &&
                                    selection.type === "presentation" &&
                                    selection.index === idx
                                }
                                onSelectToggle={() => {
                                    setSelection((old) =>
                                        old !== "session" && old.type === "presentation" && old.index === idx
                                            ? "session"
                                            : { type: "presentation", index: idx }
                                    );
                                }}
                            />
                        ))
                    )}
                    {session.items.length > 0 ? (
                        <Heading as="h4" fontSize="sm" pt={2}>
                            Exhibited Items
                        </Heading>
                    ) : undefined}
                    {session.items.map((item, idx) => (
                        <ItemCard
                            key={"item-" + idx}
                            item={item}
                            isSelected={selection !== "session" && selection.type === "item" && selection.index === idx}
                            onSelectToggle={() => {
                                setSelection((old) =>
                                    old !== "session" && old.type === "item" && old.index === idx
                                        ? "session"
                                        : { type: "item", index: idx }
                                );
                            }}
                        />
                    ))}
                    <Box h={4}>&nbsp;</Box>
                </VStack>
            ) : undefined} */}
        </VStack>
    );
}

function Tags({
    tags,
    itemTags,
}: {
    tags: ReadonlyArray<ManageSchedule_TagFragment>;
    itemTags: ReadonlyArray<ManageSchedule_ItemTagFragment>;
}): JSX.Element {
    const matchedTags = useMemo(
        () =>
            R.sortWith(
                [
                    (a, b) => maybeCompare(a.tag?.priority, b.tag?.priority, (x, y) => x - y),
                    (a, b) => maybeCompare(a.tag?.name, b.tag?.name, (x, y) => x.localeCompare(y)),
                ],
                itemTags.map((itemTag) => ({
                    itemTag,
                    tag: tags.find((x) => x.id === itemTag.tagId),
                }))
            ).slice(0, 3),
        [itemTags, tags]
    );

    return (
        <Wrap>
            {matchedTags.map((tag, idx) => (
                <WrapItem key={idx}>
                    <Tag borderRadius="full" colorScheme="gray">
                        {tag.tag?.name ?? "<unknown>"}
                    </Tag>
                </WrapItem>
            ))}
            {matchedTags.length < itemTags.length ? (
                <WrapItem>
                    <Tag borderRadius="full" colorScheme="gray">
                        {itemTags.length - matchedTags.length} more
                    </Tag>
                </WrapItem>
            ) : undefined}
        </Wrap>
    );
}
