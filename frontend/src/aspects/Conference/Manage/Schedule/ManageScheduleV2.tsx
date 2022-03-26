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
import { gql } from "urql";
import type { ManageSchedule_SessionFragment } from "../../../../generated/graphql";
import { Schedule_Mode_Enum, useManageSchedule_GetSessionsPageQuery } from "../../../../generated/graphql";
import Card from "../../../Card";
import Editor from "../../../CRUDCards/Editor";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import DetailsPanel from "./Components/DetailsPanel";
import HeaderControls from "./Components/HeaderControls";

gql`
    fragment ManageSchedule_ItemTag on content_ItemTag {
        id
        tagId
    }

    fragment ManageSchedule_SessionContent on content_Item {
        id
        title
        typeName
        itemTags {
            ...ManageSchedule_ItemTag
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
        ) {
            ...ManageSchedule_Session
        }
    }
`;

export default function ManageScheduleV2(): JSX.Element {
    const sessionEditorDisclosure = useDisclosure();
    const [sessionEditorIsCreate, setSessionEditorIsCreate] = useState<boolean>(false);

    const [initialStepIdx, setInitialStepIdx] = useState<number>(0);
    const [currentRecord, setCurrentRecord] = useState<Partial<any>>({});

    const onCreateSession = useCallback(() => {
        setCurrentRecord({});
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
                        panel: (_props) => <>TODO</>,
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
                onSave={async (_record) => {
                    // TODO:
                    setIsSaving(true);
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    setIsSaving(false);
                    return { error: "not implemented" };
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
