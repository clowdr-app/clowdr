import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    HStack,
    IconButton,
    Spinner,
    Tag,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ManageSchedule_GetAllSessionIdsQuery,
    ManageSchedule_GetAllSessionIdsQueryVariables,
    ManageSchedule_InsertEventMutation,
    ManageSchedule_InsertEventMutationVariables,
    ManageSchedule_SessionFragment,
} from "../../../../generated/graphql";
import {
    Content_ItemType_Enum,
    ManageSchedule_GetAllSessionIdsDocument,
    ManageSchedule_InsertEventDocument,
    Schedule_Mode_Enum,
    useManageSchedule_GetSessionsPageQuery,
} from "../../../../generated/graphql";
import Card from "../../../Card";
import Editor from "../../../CRUDCards/Editor";
import type { DeepPartial } from "../../../CRUDCards/Types";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
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

        item {
            ...ManageSchedule_SessionContent
        }

        eventPeople {
            ...ManageSchedule_EventPerson
        }
    }

    query ManageSchedule_GetSessionsPage(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $limit: Int!
        $offset: Int!
    ) {
        schedule_Event_aggregate(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                sessionEventId: { _is_null: true }
            }
        ) {
            aggregate {
                count
            }
        }

        schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                sessionEventId: { _is_null: true }
            }
            limit: $limit
            offset: $offset
            order_by: [{ scheduledStartTime: asc }, { scheduledEndTime: asc }, { room: { name: asc } }]
        ) {
            ...ManageSchedule_Session
        }
    }

    query ManageSchedule_GetAllSessionIds($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                sessionEventId: { _is_null: true }
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
    const [sessionsResponse] = useManageSchedule_GetSessionsPageQuery({
        requestPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
            limit,
            offset,
        },
        context,
    });
    const actualError = useMemo(() => extractActualError(sessionsResponse.error), [sessionsResponse.error]);

    const [selectedSessions, setSelectedSessions] = useState<ReadonlySet<string>>(new Set());

    const client = useClient();

    return (
        <DashboardPage title="Schedule" controls={headerControls}>
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

                        // TODO: Filters
                        const ordering = await client
                            .query<ManageSchedule_GetAllSessionIdsQuery, ManageSchedule_GetAllSessionIdsQueryVariables>(
                                ManageSchedule_GetAllSessionIdsDocument,
                                {
                                    conferenceId: conference.id,
                                    subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
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
            <VStack spacing={4} justifyContent="flex-start" alignItems="flex-start">
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
                        />
                    ))
                )}
            </VStack>
            <HStack spacing={4} pt={4}>
                <IconButton
                    aria-label="Previous page"
                    icon={<ChevronLeftIcon />}
                    onClick={() => {
                        setOffset((old) => Math.max(0, old - limit));
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

    isSelected,
    isDisabled,
    onSelectToggle,
}: {
    session: ManageSchedule_SessionFragment;

    isSelected: boolean;
    isDisabled?: boolean;
    onSelectToggle: () => void;
}): JSX.Element {
    const ref = useRef<HTMLDivElement | null>(null);
    const start = useMemo(() => new Date(session.scheduledStartTime), [session.scheduledStartTime]);
    const end = useMemo(() => new Date(session.scheduledEndTime), [session.scheduledEndTime]);
    const duration = useMemo(() => Math.round((end.getTime() - start.getTime()) / (60 * 1000)), [end, start]);
    const presentationsDisclosure = useDisclosure();

    return (
        <VStack minW="400px" w="calc(50% - var(--chakra-space-2))" alignItems="flex-start">
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
                        hour: "numeric",
                        minute: "numeric",
                    }) +
                    " - " +
                    new Date(start.getTime() + 1000 * 60 * duration).toLocaleString(undefined, {
                        hour: "numeric",
                        minute: "numeric",
                    }) +
                    ` (${
                        duration >= 120
                            ? (duration % 60 === 0 ? (duration / 60).toFixed(0) : (duration / 60).toFixed(1)) + " hours"
                            : duration + " minutes"
                    })`
                }
                heading={session.item?.title ?? session.name}
                w="100%"
                bottomButton={{
                    label: "Expand list of presentations in this session",
                    colorScheme: "blue",
                    icon: presentationsDisclosure.isOpen ? "chevron-up" : "chevron-down",
                    iconStyle: "s",
                    onClick: () => {
                        if (!isDisabled) {
                            presentationsDisclosure.onToggle();
                        }
                    },
                    variant: "ghost",
                }}
                editControls={
                    session.modeName && session.modeName !== Schedule_Mode_Enum.VideoChat
                        ? [
                              <Tag borderRadius="full" colorScheme="purple" key="mode-tag">
                                  {session.modeName}
                              </Tag>,
                          ]
                        : []
                }
            >
                TODO
                {/* <Text noOfLines={3}>{session.content.abstract}</Text>
                <People people={session.content.chairs} colorScheme="yellow" />
                <Tags tags={session.content.tags} /> */}
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
