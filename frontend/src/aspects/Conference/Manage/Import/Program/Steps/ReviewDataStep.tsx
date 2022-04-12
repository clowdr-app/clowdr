import {
    Box,
    chakra,
    Divider,
    Heading,
    HStack,
    Table,
    Tag,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import type {
    Author,
    Chair,
    Content,
    DataWithValidation,
    ErrorAnnotation,
    Exhibition,
    Presentation,
    Primitive,
    Session,
    Speaker,
    ValidatedData,
    WithErrors,
} from "@midspace/shared-types/import/program";
import { anyAnnotatedErrors } from "@midspace/shared-types/import/program";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../../../../../Card";
import FAIcon from "../../../../../Chakra/FAIcon";
import { Markdown } from "../../../../../Chakra/Markdown";
import type { ParsedData } from "../../../../../Files/useCSVJSONXMLParser";
import Step from "./Step";
import { getUTCDateInstance } from "./Utilities";

export default function ReviewDataStep({
    data,
    onValidatedData,
    onNextStep,
    onPreviousStep,
    onCanProceedChange,
    isActive,
}: {
    data: ParsedData<DataWithValidation>[] | undefined;
    onValidatedData: (data: ParsedData<ValidatedData>[] | undefined) => void;
    onNextStep?: () => void;
    onPreviousStep?: () => void;
    onCanProceedChange?: (canProceed: boolean) => void;
    isActive: boolean;
}): JSX.Element {
    const cleanData = useMemo(() => (isActive && data ? cleanupData(data) : []), [isActive, data]);
    useEffect(() => {
        onValidatedData(cleanData);
    }, [onValidatedData, cleanData]);

    useEffect(() => {
        onCanProceedChange?.(true);
    }, [onCanProceedChange]);

    const [selection, setSelection] = useState<{
        fileName: string;
        type: "session" | "exhibition";
        index: number;
    } | null>(null);

    return (
        <Step
            onNextStep={onNextStep}
            isNextStepEnabled={Boolean(data?.length)}
            onPreviousStep={onPreviousStep}
            isPreviousStepEnabled={true}
        >
            {cleanData.flatMap((record, recordIdx) => {
                if ("data" in record) {
                    const result = [
                        <Heading as="h2" fontSize="md" key={record.fileName + " - Heading"} pt={2}>
                            {record.fileName}
                        </Heading>,
                        <Heading as="h3" fontSize="sm" key={record.fileName + " - Sessions Heading"} pt={2}>
                            Sessions
                        </Heading>,
                        ...record.data.sessions.map((session, idx) => {
                            const isSelected =
                                selection?.fileName === record.fileName &&
                                selection?.type === "session" &&
                                selection?.index === idx;
                            return (
                                <SessionCard
                                    key={record.fileName + "-session-" + idx}
                                    session={session}
                                    isSelected={isSelected}
                                    onSelectToggle={() => {
                                        setSelection((old) =>
                                            old?.fileName === record.fileName &&
                                            old?.type === "session" &&
                                            old?.index === idx
                                                ? null
                                                : {
                                                      fileName: record.fileName,
                                                      type: "session",
                                                      index: idx,
                                                  }
                                        );
                                    }}
                                />
                            );
                        }),
                        <Divider key={record.fileName + " - Exhibitions Divider"} pt={2} />,
                        <Heading as="h3" fontSize="sm" key={record.fileName + " - Exhibitions Heading"} pt={2}>
                            Exhibitions
                        </Heading>,
                        ...record.data.exhibitions.map((exhibition, idx) => {
                            const isSelected =
                                selection?.fileName === record.fileName &&
                                selection?.type === "exhibition" &&
                                selection?.index === idx;
                            return (
                                <ExhibitionCard
                                    key={record.fileName + "-exhibition-" + idx}
                                    exhibition={exhibition}
                                    isSelected={isSelected}
                                    onSelectToggle={() => {
                                        setSelection((old) =>
                                            old?.fileName === record.fileName &&
                                            old?.type === "exhibition" &&
                                            old?.index === idx
                                                ? null
                                                : {
                                                      fileName: record.fileName,
                                                      type: "exhibition",
                                                      index: idx,
                                                  }
                                        );
                                    }}
                                />
                            );
                        }),
                    ];

                    if (recordIdx < cleanData.length - 1) {
                        result.push(<Divider key={record.fileName + "divider"} pt={4} mb={2} />);
                    }

                    return result;
                }
                return [];
            })}
        </Step>
    );
}

function SessionCard({
    session,

    isSelected,
    isDisabled,
    onSelectToggle,
}: {
    session: Session;

    isSelected: boolean;
    isDisabled?: boolean;
    onSelectToggle: () => void;
}): JSX.Element {
    const [selection, setSelection] = useState<"session" | { index: number; type: "presentation" }>("session");

    const ref = useRef<HTMLDivElement | null>(null);
    const start =
        typeof session.event.start === "string" ? getUTCDateInstance(session.event.start) : session.event.start;

    return (
        <HStack w="100%" minW="calc(800px + var(--chakra-space-4))" spacing={4} alignItems="flex-start">
            <VStack minW="400px" w="calc(50% - var(--chakra-space-2))" alignItems="flex-start">
                <Card
                    ref={ref}
                    isSelectable
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onSelectToggle={() => {
                        if (!isSelected) {
                            setSelection("session");
                            setTimeout(() => {
                                ref.current?.scrollIntoView();
                            }, 50);
                        }
                        onSelectToggle();
                    }}
                    subHeading={
                        start.toLocaleString(undefined, {
                            weekday: "short",
                            hour: "numeric",
                            minute: "numeric",
                        }) +
                        " - " +
                        new Date(start.getTime() + 1000 * 60 * session.event.duration).toLocaleString(undefined, {
                            hour: "numeric",
                            minute: "numeric",
                        }) +
                        ` (${
                            session.event.duration >= 120
                                ? (session.event.duration % 60 === 0
                                      ? (session.event.duration / 60).toFixed(0)
                                      : (session.event.duration / 60).toFixed(1)) + " hours"
                                : session.event.duration + " minutes"
                        })`
                    }
                    heading={session.content.title ?? "<No title>"}
                    w="100%"
                    rightButton={{
                        label: "Expand session details",
                        colorScheme: "blue",
                        icon: isSelected && selection === "session" ? "chevron-left" : "chevron-right",
                        iconStyle: "s",
                        onClick: () => {
                            if (!isDisabled) {
                                if (selection === "session") {
                                    onSelectToggle?.();
                                }

                                if (!isSelected || selection !== "session") {
                                    setSelection("session");
                                }
                            }
                        },
                        variant: isSelected && selection === "session" ? "solid" : "ghost",
                    }}
                    bottomButton={{
                        label: "Expand list of presentations in this session",
                        colorScheme: "blue",
                        icon: isSelected ? "chevron-up" : "chevron-down",
                        iconStyle: "s",
                        onClick: () => {
                            if (!isDisabled) {
                                onSelectToggle();
                            }
                        },
                        variant: "ghost",
                    }}
                    editControls={
                        session.event.interactionMode && session.event.interactionMode !== "video-chat"
                            ? [
                                  <Tag borderRadius="full" colorScheme="purple" key="mode-tag">
                                      {session.event.interactionMode}
                                  </Tag>,
                              ]
                            : []
                    }
                >
                    <Text noOfLines={3}>{session.content.abstract}</Text>
                    <People people={session.content.chairs} colorScheme="yellow" />
                    <Tags tags={session.content.tags} />
                </Card>
                {isSelected ? (
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
                        <Box h={4}>&nbsp;</Box>
                    </VStack>
                ) : undefined}
            </VStack>
            {isSelected ? (
                selection === "session" ? (
                    <SessionDetailsCard session={session} />
                ) : (
                    <PresentationDetailsCard presentation={session.presentations[selection.index]} />
                )
            ) : undefined}
        </HStack>
    );
}

function PresentationCard({
    presentation,

    isSelected,
    isDisabled,
    onSelectToggle,
}: {
    presentation: Presentation;

    isSelected: boolean;
    isDisabled?: boolean;
    onSelectToggle: () => void;
}) {
    return (
        <Card
            isSelectable
            isSelected={isSelected}
            isDisabled={isDisabled}
            onSelectToggle={onSelectToggle}
            rightButton={{
                label: "Expand presentation details",
                colorScheme: "blue",
                icon: isSelected ? "chevron-left" : "chevron-right",
                iconStyle: "s",
                onClick: () => {
                    if (!isDisabled) {
                        onSelectToggle?.();
                    }
                },
                variant: isSelected ? "solid" : "ghost",
            }}
            minW="calc(400px - var(--chakra-space-4))"
            w="100%"
            subHeading={
                presentation.event.duration !== undefined &&
                presentation.event.duration !== null &&
                presentation.event.duration > 0
                    ? presentation.event.duration >= 120
                        ? (presentation.event.duration % 60 === 0
                              ? (presentation.event.duration / 60).toFixed(0)
                              : (presentation.event.duration / 60).toFixed(1)) + " hours"
                        : presentation.event.duration + " minutes"
                    : undefined
            }
            heading={presentation.content.title ?? "<No title>"}
            editControls={
                presentation.event.interactionMode && presentation.event.interactionMode !== "video-chat"
                    ? [
                          <Tag borderRadius="full" colorScheme="purple" key="mode-tag">
                              {presentation.event.interactionMode}
                          </Tag>,
                          <Tag
                              borderRadius="full"
                              colorScheme={!presentation.content.type ? "red" : "purple"}
                              key="type-tag"
                          >
                              {presentation.content.type ?? "Not imported"}
                          </Tag>,
                      ]
                    : [
                          <Tag
                              borderRadius="full"
                              colorScheme={!presentation.content.type ? "red" : "purple"}
                              key="type-tag"
                          >
                              {presentation.content.type ?? "Not imported"}
                          </Tag>,
                      ]
            }
            variant={!presentation.content.type ? "ghost" : "solid"}
        >
            <Text noOfLines={3}>{presentation.content.abstract}</Text>
            <People people={presentation.content.speakers} colorScheme="red" />
            <People people={presentation.content.authors} colorScheme="purple" />
            <Tags tags={presentation.content.tags} />
        </Card>
    );
}

function ItemCard({
    item,

    isSelected,
    isDisabled,
    onSelectToggle,
}: {
    item: Content;

    isSelected: boolean;
    isDisabled?: boolean;
    onSelectToggle: () => void;
}) {
    return (
        <Card
            isSelectable
            isSelected={isSelected}
            isDisabled={isDisabled}
            onSelectToggle={onSelectToggle}
            rightButton={{
                label: "Expand item details",
                colorScheme: "blue",
                icon: isSelected ? "chevron-left" : "chevron-right",
                iconStyle: "s",
                onClick: () => {
                    if (!isDisabled) {
                        onSelectToggle?.();
                    }
                },
                variant: isSelected ? "solid" : "ghost",
            }}
            minW="calc(400px - var(--chakra-space-4))"
            w="100%"
            heading={item.title ?? "<No title>"}
            editControls={[
                <Tag borderRadius="full" colorScheme="purple" key="type-tag">
                    {item.type}
                </Tag>,
            ]}
        >
            <Text noOfLines={3}>{item.abstract}</Text>
            <People people={item.speakers} colorScheme="red" />
            <People people={item.authors} colorScheme="purple" />
            <Tags tags={item.tags} />
        </Card>
    );
}

function ExhibitionCard({
    exhibition,

    isSelected,
    isDisabled,
    onSelectToggle,
}: {
    exhibition: Exhibition;

    isSelected: boolean;
    isDisabled?: boolean;
    onSelectToggle: () => void;
}): JSX.Element {
    const [selection, setSelection] = useState<"exhibition" | number>("exhibition");

    const ref = useRef<HTMLDivElement | null>(null);
    return (
        <HStack w="100%" minW="calc(800px + var(--chakra-space-4))" spacing={4} alignItems="flex-start">
            <VStack minW="400px" w="calc(50% - var(--chakra-space-2))" alignItems="flex-start">
                <Card
                    isSelectable
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onSelectToggle={() => {
                        if (!isSelected) {
                            setTimeout(() => {
                                ref.current?.scrollIntoView();
                            }, 50);
                        }
                        onSelectToggle();
                    }}
                    heading={exhibition.content.title ?? "<No title>"}
                    w="100%"
                    rightButton={{
                        label: "Expand exhibition details",
                        colorScheme: "blue",
                        icon: isSelected && selection === "exhibition" ? "chevron-left" : "chevron-right",
                        iconStyle: "s",
                        onClick: () => {
                            if (!isDisabled) {
                                if (selection === "exhibition") {
                                    onSelectToggle?.();
                                }

                                if (!isSelected || selection !== "exhibition") {
                                    setSelection("exhibition");
                                }
                            }
                        },
                        variant: isSelected && selection === "exhibition" ? "solid" : "ghost",
                    }}
                    bottomButton={{
                        label: "Expand list of items in this exhibition",
                        colorScheme: "blue",
                        icon: isSelected ? "chevron-up" : "chevron-down",
                        iconStyle: "s",
                        onClick: () => {
                            if (!isDisabled) {
                                onSelectToggle();
                            }
                        },
                        variant: "ghost",
                    }}
                >
                    <Text noOfLines={3}>{exhibition.content.abstract}</Text>
                    <People people={exhibition.content.chairs} colorScheme="yellow" />
                    <Tags tags={exhibition.content.tags} />
                </Card>
                {isSelected ? (
                    <VStack pl={8} alignItems="flex-start" w="100%" zIndex={1} spacing={4}>
                        <Heading as="h4" fontSize="sm" pt={2}>
                            Items
                        </Heading>
                        {exhibition.items.length === 0 ? (
                            <Text>No items</Text>
                        ) : (
                            exhibition.items.map((item, idx) => (
                                <ItemCard
                                    key={"item-" + idx}
                                    item={item}
                                    isSelected={selection !== "exhibition" && selection === idx}
                                    onSelectToggle={() => {
                                        setSelection((old) =>
                                            old !== "exhibition" && old === idx ? "exhibition" : idx
                                        );
                                    }}
                                />
                            ))
                        )}
                        <Box h={4}>&nbsp;</Box>
                    </VStack>
                ) : undefined}
            </VStack>
            {isSelected ? (
                selection === "exhibition" ? (
                    <ExhibitionDetailsCard exhibition={exhibition} />
                ) : (
                    <ItemDetailsCard item={exhibition.items[selection]} />
                )
            ) : undefined}
        </HStack>
    );
}

function SessionDetailsCard({ session }: { session: Session }): JSX.Element {
    const start =
        typeof session.event.start === "string" ? getUTCDateInstance(session.event.start) : session.event.start;

    return (
        <Card
            subHeading={
                start.toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "numeric",
                }) +
                " - " +
                new Date(start.getTime() + 1000 * 60 * session.event.duration).toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                }) +
                ` (${
                    session.event.duration >= 120
                        ? (session.event.duration % 60 === 0
                              ? (session.event.duration / 60).toFixed(0)
                              : (session.event.duration / 60).toFixed(1)) + " hours"
                        : session.event.duration + " minutes"
                })`
            }
            heading={session.content.title ?? "<No title>"}
            w="calc(50% - var(--chakra-space-2))"
            minW="400px"
            pos="sticky"
            top={0}
            left={0}
            editControls={[
                ...(session.event.interactionMode
                    ? [
                          <Tag borderRadius="full" colorScheme="purple" key="mode-tag">
                              {session.event.interactionMode}
                          </Tag>,
                      ]
                    : []),
                <Tag borderRadius="full" colorScheme="purple" key="type-tag">
                    Session
                </Tag>,
            ]}
        >
            <Markdown>{session.content.abstract}</Markdown>
            <Tags tags={session.content.tags} />
            <People people={session.content.chairs} colorScheme="yellow" asTable />
        </Card>
    );
}

function ExhibitionDetailsCard({ exhibition }: { exhibition: Exhibition }): JSX.Element {
    return (
        <Card
            heading={exhibition.content.title ?? "<No title>"}
            w="calc(50% - var(--chakra-space-2))"
            minW="400px"
            pos="sticky"
            top={0}
            left={0}
            editControls={[
                <Tag borderRadius="full" colorScheme="purple" key="type-tag">
                    Exhibition
                </Tag>,
            ]}
        >
            <Markdown>{exhibition.content.abstract}</Markdown>
            <Tags tags={exhibition.content.tags} />
            <People people={exhibition.content.chairs} colorScheme="yellow" asTable />
        </Card>
    );
}

function PresentationDetailsCard({ presentation }: { presentation: Presentation }): JSX.Element {
    return (
        <Card
            subHeading={
                presentation.event.duration !== undefined &&
                presentation.event.duration !== null &&
                presentation.event.duration > 0
                    ? presentation.event.duration >= 120
                        ? (presentation.event.duration % 60 === 0
                              ? (presentation.event.duration / 60).toFixed(0)
                              : (presentation.event.duration / 60).toFixed(1)) + " hours"
                        : presentation.event.duration + " minutes"
                    : undefined
            }
            heading={presentation.content.title ?? "<No title>"}
            w="calc(50% - var(--chakra-space-2))"
            minW="400px"
            pos="sticky"
            top={0}
            left={0}
            editControls={
                presentation.content.type
                    ? [
                          ...(presentation.event.interactionMode
                              ? [
                                    <Tag borderRadius="full" colorScheme="purple" key="mode-tag">
                                        {presentation.event.interactionMode}
                                    </Tag>,
                                ]
                              : []),
                          <Tag borderRadius="full" colorScheme="purple" key="type-tag">
                              {presentation.content.type}
                          </Tag>,
                      ]
                    : [
                          <Tag borderRadius="full" colorScheme="red" key="type-tag">
                              Not imported
                          </Tag>,
                      ]
            }
            variant={!presentation.content.type ? "ghost" : "solid"}
        >
            {!presentation.content.type ? (
                <>
                    <Text>
                        This will not be included in the program listing. It will be used as part of the timing
                        calculation for presentations in the session but it will not be imported.
                    </Text>
                    <Text fontWeight="bold">
                        <FAIcon iconStyle="s" icon="exclamation-triangle" color="yellow.400" mr={2} />
                        <chakra.span verticalAlign="middle">
                            Set a presentation type if you intended to include this presentation in the import.
                        </chakra.span>
                    </Text>
                </>
            ) : (
                <>
                    <Markdown>{presentation.content.abstract}</Markdown>
                    <Tags tags={presentation.content.tags} />
                    <ContentUploadSummary content={presentation.content} />
                    <People
                        people={[
                            ...presentation.content.speakers.map((x) => ({ ...x, role: "Speaker" })),
                            ...presentation.content.authors.map((x) => ({ ...x, role: "Author" })),
                            ...presentation.content.chairs.map((x) => ({ ...x, role: "Chair" })),
                        ]}
                        colorScheme="gray"
                        asTable
                    />
                </>
            )}
        </Card>
    );
}

function ItemDetailsCard({ item }: { item: Content }): JSX.Element {
    return (
        <Card
            heading={item.title ?? "<No title>"}
            w="calc(50% - var(--chakra-space-2))"
            minW="400px"
            pos="sticky"
            top={0}
            left={0}
            editControls={[
                <Tag borderRadius="full" colorScheme="purple" key="type-tag">
                    {item.type}
                </Tag>,
            ]}
        >
            <Markdown>{item.abstract}</Markdown>
            <Tags tags={item.tags} />
            <ContentUploadSummary content={item} />
            <People
                people={[
                    ...item.speakers.map((x) => ({ ...x, role: "Speaker" })),
                    ...item.authors.map((x) => ({ ...x, role: "Author" })),
                    ...item.chairs.map((x) => ({ ...x, role: "Chair" })),
                ]}
                colorScheme="gray"
                asTable
            />
        </Card>
    );
}

function People({
    people,
    asTable,
    colorScheme,
}: {
    people: (Chair | Speaker | Author)[] | ((Chair | Speaker | Author) & { role: "Chair" | "Speaker" | "Author" })[];
    asTable?: boolean;
    colorScheme: string;
}) {
    if (people.length === 0) {
        return <></>;
    }

    const anyHasRole = people.some((x) => "role" in x);

    if (asTable) {
        return (
            <Box overflowY="visible" overflowX="auto" w="100%" h="auto" pt={2}>
                <Table w="100%" size="sm">
                    <Thead>
                        {anyHasRole ? <Th>Role</Th> : undefined}
                        <Th>Name</Th>
                        <Th>Affiliation</Th>
                        <Th>Email</Th>
                    </Thead>
                    <Tbody>
                        {people.map((person, idx) => (
                            <Tr key={idx}>
                                {anyHasRole ? <Td>{"role" in person ? person.role : ""}</Td> : undefined}
                                <Td>{person.name}</Td>
                                <Td>{person.affiliation}</Td>
                                <Td>{person.email}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    } else {
        return (
            <Wrap>
                {people.map((person, idx) => (
                    <WrapItem key={idx}>
                        <Tag borderRadius="full" colorScheme={colorScheme}>
                            {person.name}
                        </Tag>
                    </WrapItem>
                ))}
            </Wrap>
        );
    }
}

function Tags({ tags, colorScheme = "green" }: { tags: string[]; colorScheme?: string }) {
    return (
        <Wrap>
            {tags.map((tag, idx) => (
                <WrapItem key={idx}>
                    <Tag borderRadius="full" colorScheme={colorScheme}>
                        {tag}
                    </Tag>
                </WrapItem>
            ))}
        </Wrap>
    );
}

function ContentUploadSummary({ content }: { content: Content }): JSX.Element {
    return (
        <Table size="sm" variant="ghost" w="auto">
            <Tr>
                <Td fontWeight="semibold">Editable abstract?</Td>
                <Td>{content.editableAbstract ? "Yes" : "No"}</Td>
            </Tr>
            <Tr>
                <Td fontWeight="semibold">Image or poster upload?</Td>
                <Td>{content.imageOrPosterUpload ? "Request from speakers" : "Do not request from speakers"}</Td>
            </Tr>
            <Tr>
                <Td fontWeight="semibold">Slides upload?</Td>
                <Td>{content.slidesUpload ? "Request from speakers" : "Do not request from speakers"}</Td>
            </Tr>
            <Tr>
                <Td fontWeight="semibold">Video upload?</Td>
                <Td>{content.videoUpload ? "Request from speakers" : "Do not request from speakers"}</Td>
            </Tr>
            <Tr>
                <Td fontWeight="semibold">Website link upload?</Td>
                <Td>{content.websiteLinkUpload ? "Request from speakers" : "Do not request from speakers"}</Td>
            </Tr>
            <Tr></Tr>
        </Table>
    );
}

function cleanupData(files: ParsedData<DataWithValidation>[]): ParsedData<ValidatedData>[] {
    const result: ParsedData<ValidatedData>[] = [];
    for (const file of files) {
        if ("data" in file) {
            result.push({
                fileName: file.fileName,
                data: {
                    sessions: clearErrors<Session>(
                        file.data.sessions.filter(
                            (x) => x.value && typeof x.value !== "string" && "content" in x.value
                        ) as ErrorAnnotation<WithErrors<Session>>[]
                    ),
                    exhibitions: clearErrors<Exhibition>(file.data.exhibitions),
                },
            });
        }
    }
    return result;
}

function clearErrors<T>(records: ErrorAnnotation<WithErrors<T>>[]): T[] {
    const result: T[] = [];
    for (const record of records) {
        if (!anyAnnotatedErrors(record)) {
            result.push(stripErrors(record));
        }
    }
    return result;
}

function stripErrors<T>(record: ErrorAnnotation<WithErrors<T>>): T {
    const value = record.value as WithErrors<T>;

    if (!value || typeof value !== "object" || value instanceof Date) {
        return value as any;
    }

    const result: T = {} as any;

    for (const key in value) {
        const fieldValue:
            | ErrorAnnotation<WithErrors<any>>
            | ErrorAnnotation<WithErrors<any>>[]
            | ErrorAnnotation<Primitive> = value[key];
        if (!fieldValue) {
            result[key] = fieldValue;
        } else if (fieldValue instanceof Array) {
            const arr: any[] = [];
            (result as any)[key] = arr;
            for (const val of fieldValue) {
                arr.push(stripErrors(val));
            }
        } else if (typeof fieldValue === "object" && !(fieldValue instanceof Date)) {
            (result as any)[key] = stripErrors(fieldValue as ErrorAnnotation<WithErrors<any>>);
        } else {
            (result as any)[key] = fieldValue;
        }
    }

    return result;
}
