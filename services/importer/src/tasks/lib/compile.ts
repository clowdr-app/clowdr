/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ElementDataBlob } from "@midspace/shared-types/content";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import type {
    Content,
    Event,
    Exhibition,
    PresentationWithAllocatedTime,
    Session,
} from "@midspace/shared-types/import/program";
import type { ProgramImportOptions } from "@midspace/shared-types/import/programImportOptions";
import crypto from "crypto";
import * as R from "ramda";
import type {
    Collection_Exhibition,
    Collection_ProgramPerson,
    Collection_Tag,
    Content_Element,
    Content_Item,
    Content_ItemExhibition,
    Content_ItemProgramPerson,
    Content_ItemTag,
    Room_Room,
    Room_ShufflePeriod,
    Schedule_Continuation,
    Schedule_Event,
    Schedule_EventProgramPerson,
} from "../../generated/graphql";
import {
    Content_ElementType_Enum,
    Content_ItemType_Enum,
    Room_ManagementMode_Enum,
    Schedule_EventProgramPersonRole_Enum,
    Schedule_Mode_Enum,
} from "../../generated/graphql";
import { publishTask } from "../../rabbitmq/tasks";
import type { Context } from "../../types/context";
import type { ImportJob } from "../../types/job";
import type { ImportOutputSelector, InsertData } from "../../types/task";
import { composeOutputNames } from "./names";

export type Entity = {
    __remapColumns: string[];
    __outputs: ImportOutputSelector[];
} & (
    | Partial<Room_Room>
    | Partial<Room_ShufflePeriod>
    | Partial<Collection_Exhibition>
    | Partial<Collection_ProgramPerson>
    | Partial<Collection_Tag>
    | Partial<Content_Item>
    | Partial<Content_ItemProgramPerson>
    | Partial<Content_ItemTag>
    | Partial<Content_ItemExhibition>
    | Partial<Content_Element>
    | Partial<Schedule_Event>
    | Partial<Schedule_Continuation>
    | Partial<Schedule_EventProgramPerson>
);

const applyEntitiesOrdering: Record<NonNullable<Entity["__typename"]>, number> = {
    collection_ProgramPerson: 1,
    collection_Tag: 2,

    room_ShufflePeriod: 3,

    content_Item: 4,
    room_Room: 5, // Item Id
    collection_Exhibition: 6, // Descriptive item
    schedule_Event: 7,

    content_Element: 8,

    schedule_Continuation: 9,

    content_ItemExhibition: 10,
    content_ItemProgramPerson: 11,
    content_ItemTag: 12,
    schedule_EventProgramPerson: 13,
};

const entityTypenamesToApplyType: Record<NonNullable<Entity["__typename"]>, InsertData["type"]> = {
    collection_Exhibition: "Exhibition",
    collection_ProgramPerson: "ProgramPerson",
    collection_Tag: "Tag",

    room_Room: "Room",
    room_ShufflePeriod: "ShufflePeriod",

    content_Item: "Item",
    schedule_Event: "Event",

    content_Element: "Element",

    schedule_Continuation: "Continutation",

    content_ItemExhibition: "ItemExhibition",
    content_ItemProgramPerson: "ItemProgramPerson",
    content_ItemTag: "ItemTag",
    schedule_EventProgramPerson: "EventProgramPerson",
};

const contentTypeMap: Record<NonNullable<Content["type"]>, Content_ItemType_Enum> = {
    "Session Q&A": Content_ItemType_Enum.SessionQAndA,
    Session: Content_ItemType_Enum.Session,
    Demonstration: Content_ItemType_Enum.Demonstration,
    Keynote: Content_ItemType_Enum.Keynote,
    Other: Content_ItemType_Enum.Other,
    Paper: Content_ItemType_Enum.Paper,
    Poster: Content_ItemType_Enum.Poster,
    Presentation: Content_ItemType_Enum.Presentation,
    Social: Content_ItemType_Enum.Social,
    Symposium: Content_ItemType_Enum.Symposium,
    Tutorial: Content_ItemType_Enum.Tutorial,
    Workshop: Content_ItemType_Enum.Workshop,
};

export function generateRootExhibitionEntities(
    exhibition: Exhibition,
    rootOutputName: string,
    options: ProgramImportOptions,
    context: Context
): Entity[] {
    return [
        ...generateExhibitionEntities(
            exhibition.content.title ?? "<No title>",
            exhibition.items.map((_, idx) =>
                composeOutputNames(
                    composeOutputNames(rootOutputName, `items[${idx}]`),
                    composeOutputNames("content", "id")
                )
            ),
            composeOutputNames(composeOutputNames(rootOutputName, "content"), "id"),
            false,
            composeOutputNames(rootOutputName, "exhibition"),
            context
        ),
        ...generateContentEntities(
            exhibition.content,
            composeOutputNames(rootOutputName, "content"),
            undefined,
            options,
            context
        ),
        ...exhibition.items.flatMap<Entity>((item, idx) => {
            const itemRootOutputName = composeOutputNames(rootOutputName, `items[${idx}]`);
            return [
                ...generateContentEntities(
                    item,
                    composeOutputNames(itemRootOutputName, "content"),
                    { name: composeOutputNames(rootOutputName, "exhibition"), priority: idx },
                    options,
                    context
                ),
                ...generateRoomEntities(
                    item.title ?? `No title @ ${itemRootOutputName}`,
                    composeOutputNames(composeOutputNames(itemRootOutputName, "content"), "id"),
                    composeOutputNames(itemRootOutputName, "room"),
                    context
                ),
            ];
        }),
    ];
}

export function generateSessionEntities(
    session: Session,
    rootOutputName: string,
    options: ProgramImportOptions,
    context: Context
): Entity[] {
    const roomOutputName = composeOutputNames(rootOutputName, "room");
    const sessionContentOutputName = composeOutputNames(rootOutputName, "content");
    const sessionEventOutputName = composeOutputNames(rootOutputName, "event");

    const sessionHasExhibition = session.presentations.some(
        (x) => (x.event.interactionMode ?? options.defaultEventMode) === "breakout video-chat"
    );
    const sessionExhibitionOutputName = sessionHasExhibition
        ? composeOutputNames(rootOutputName, "exhibition")
        : undefined;

    const result: Entity[] = [
        ...generateContentEntities(session.content, sessionContentOutputName, undefined, options, context),
        ...generateEventEntities(
            session.event,
            sessionEventOutputName,
            sessionContentOutputName,
            sessionExhibitionOutputName,
            undefined,
            roomOutputName,
            options,
            context
        ),
        ...generateRoomEntities(session.event.roomName!, undefined, roomOutputName, context),
    ];

    // Assign times to presentations

    const sessionStart = typeof session.event.start === "string" ? new Date(session.event.start) : session.event.start;
    let presentationStartMs = sessionStart.getTime();
    let presentationsWithTimes: PresentationWithAllocatedTime[] = [];
    for (const presentation of session.presentations) {
        if (presentation.event.duration > 0) {
            presentationsWithTimes.push({
                ...presentation,
                event: {
                    ...presentation.event,
                    start: new Date(presentationStartMs),
                },
            });
            presentationStartMs += presentation.event.duration * 60 * 1000;
        } else {
            presentationsWithTimes.push({
                ...presentation,
                event: {
                    ...presentation.event,
                    start: null,
                },
            });
        }
    }
    // Drop presentations that were only for filling time (i.e. ones with no content type)
    presentationsWithTimes = presentationsWithTimes.filter((x) => x.content.type);

    if (sessionHasExhibition) {
        // Generate session exhibition
        result.push(
            ...generateExhibitionEntities(
                session.content.title ?? "<No title>",
                [
                    ...presentationsWithTimes.map((_, presIdx) =>
                        composeOutputNames(
                            composeOutputNames(rootOutputName, `presentations[${presIdx}]`),
                            composeOutputNames("content", "id")
                        )
                    ),
                ],
                composeOutputNames(sessionContentOutputName, "id"),
                true,
                sessionExhibitionOutputName!,
                context
            )
        );
    }

    result.push(
        ...presentationsWithTimes.flatMap((presentation, idx) => {
            const presentationOutputName = composeOutputNames(rootOutputName, `presentations[${idx}]`);
            const presentationContentOutputName = composeOutputNames(presentationOutputName, "content");
            return [
                ...generateContentEntities(
                    presentation.content,
                    presentationContentOutputName,
                    sessionExhibitionOutputName ? { name: sessionExhibitionOutputName, priority: idx } : undefined,
                    options,
                    context,
                    session.content.title
                ),
                ...(sessionHasExhibition
                    ? generateRoomEntities(
                          presentation.content.title ?? `No title @ ${presentationOutputName}`,
                          composeOutputNames(composeOutputNames(presentationOutputName, "content"), "id"),
                          composeOutputNames(presentationOutputName, "room"),
                          context
                      )
                    : []),
                ...generateEventEntities(
                    presentation.event,
                    composeOutputNames(presentationOutputName, "event"),
                    presentationContentOutputName,
                    sessionExhibitionOutputName,
                    sessionEventOutputName,
                    roomOutputName,
                    options,
                    context
                ),
            ];
        })
    );

    return result;
}

export function generateContentEntities(
    content: Content,
    rootOutputName: string,
    exhibitionOutput: { name: string; priority: number } | undefined,
    options: ProgramImportOptions,
    context: Context,
    sessionTitle?: string | null
): Entity[] {
    const itemIdOutputName = composeOutputNames(rootOutputName, "id");

    const tagNames = [...content.tags];
    if (options.tagPresentationsBySession && sessionTitle?.length) {
        tagNames.push(sessionTitle);
    }
    const result: Entity[] = [
        {
            __outputs: [
                {
                    columnName: "id",
                    outputName: itemIdOutputName,
                },
            ],
            __remapColumns: [],

            __typename: "content_Item",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            title: content.title ?? undefined,
            typeName: content.type ? contentTypeMap[content.type] : undefined,
        },
        ...tagNames.map<Entity>((name, idx) => ({
            __outputs: [
                {
                    columnName: "id",
                    outputName: composeOutputNames(composeOutputNames(rootOutputName, `tags[${idx}]`), "id"),
                },
            ],
            __remapColumns: [],

            __typename: "collection_Tag",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name,
        })),
        ...tagNames.map<Entity>((_, idx) => ({
            __outputs: [],
            __remapColumns: ["itemId", "tagId"],

            __typename: "content_ItemTag",
            itemId: itemIdOutputName,
            tagId: composeOutputNames(composeOutputNames(rootOutputName, `tags[${idx}]`), "id"),
        })),
        ...(exhibitionOutput
            ? ([
                  {
                      __outputs: [],
                      __remapColumns: ["exhibitionId", "itemId"],

                      __typename: "content_ItemExhibition",
                      exhibitionId: composeOutputNames(exhibitionOutput.name, "id"),
                      itemId: itemIdOutputName,

                      priority: exhibitionOutput.priority,
                  },
              ] as Entity[])
            : []),
        ...content.chairs.map<Entity>((chair, idx) => ({
            __outputs: [
                {
                    columnName: "id",
                    outputName: composeOutputNames(composeOutputNames(rootOutputName, `chairs[${idx}]`), "id"),
                },
            ],
            __remapColumns: [],

            __typename: "collection_ProgramPerson",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name: chair.name,
            affiliation: chair.affiliation,
            email: chair.email,
        })),
        ...content.speakers.map<Entity>((speaker, idx) => ({
            __outputs: [
                {
                    columnName: "id",
                    outputName: composeOutputNames(composeOutputNames(rootOutputName, `speakers[${idx}]`), "id"),
                },
            ],
            __remapColumns: [],

            __typename: "collection_ProgramPerson",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name: speaker.name,
            affiliation: speaker.affiliation,
            email: speaker.email,
        })),
        ...content.authors.map<Entity>((author, idx) => ({
            __outputs: [
                {
                    columnName: "id",
                    outputName: composeOutputNames(composeOutputNames(rootOutputName, `authors[${idx}]`), "id"),
                },
            ],
            __remapColumns: [],

            __typename: "collection_ProgramPerson",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name: author.name,
            affiliation: author.affiliation,
            email: author.email,
        })),
        ...content.chairs.map<Entity>((_, idx) => ({
            __outputs: [],
            __remapColumns: ["itemId", "personId"],

            __typename: "content_ItemProgramPerson",
            itemId: itemIdOutputName,
            personId: composeOutputNames(composeOutputNames(rootOutputName, `chairs[${idx}]`), "id"),
            priority: idx,
            roleName: "CHAIR",
        })),
        ...content.speakers.map<Entity>((_, idx) => ({
            __outputs: [],
            __remapColumns: ["itemId", "personId"],

            __typename: "content_ItemProgramPerson",
            itemId: itemIdOutputName,
            personId: composeOutputNames(composeOutputNames(rootOutputName, `speakers[${idx}]`), "id"),
            priority: idx,
            roleName: options.speakerRoleName,
        })),
        ...content.authors.map<Entity>((_, idx) => ({
            __outputs: [],
            __remapColumns: ["itemId", "personId"],

            __typename: "content_ItemProgramPerson",
            itemId: itemIdOutputName,
            personId: composeOutputNames(composeOutputNames(rootOutputName, `authors[${idx}]`), "id"),
            priority: idx,
            roleName: "AUTHOR",
        })),
        {
            __outputs: [],
            __remapColumns: ["itemId"],

            __typename: "content_Element",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            data: [
                {
                    createdAt: Date.now(),
                    createdBy: context.createdByLabel,
                    data: {
                        baseType: "text",
                        type: Content_ElementType_Enum.Abstract,
                        text: content.abstract,
                    },
                },
            ] as ElementDataBlob,
            isHidden: false,
            itemId: itemIdOutputName,
            layoutData: {
                contentType: Content_ElementType_Enum.Abstract,
                wide: true,
                priority: 0,

                position: {
                    row: 0,
                    column: 1,
                },
                size: {
                    rows: 1,
                    columns: 4,
                },
            } as LayoutDataBlob,
            name: "Abstract",
            typeName: Content_ElementType_Enum.Abstract,
            uploadsRemaining: content.editableAbstract ? 3 : 0,
        },
    ];

    let elementPriority = 1;
    let elementRow = 1;
    let elementColumn = 4;
    if (content.videoUpload) {
        result.push({
            __outputs: [],
            __remapColumns: ["itemId"],

            __typename: "content_Element",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            data: [] as ElementDataBlob,
            isHidden: false,
            itemId: itemIdOutputName,
            layoutData: {
                contentType: Content_ElementType_Enum.VideoFile,
                wide: false,
                priority: elementPriority++,

                position: {
                    row: elementRow,
                    column: elementColumn,
                },
                size: {
                    rows: 1,
                    columns: 4,
                },
            } as LayoutDataBlob,
            name: "Video",
            typeName: Content_ElementType_Enum.VideoFile,
            uploadsRemaining: 3,
        });

        elementRow += elementColumn === 8 ? 1 : 0;
        elementColumn = elementColumn === 8 ? 4 : 8;
    }
    if (content.imageOrPosterUpload) {
        result.push({
            __outputs: [],
            __remapColumns: ["itemId"],

            __typename: "content_Element",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            data: [] as ElementDataBlob,
            isHidden: false,
            itemId: itemIdOutputName,
            layoutData: {
                contentType: Content_ElementType_Enum.ImageFile,
                wide: false,
                priority: elementPriority++,

                position: {
                    row: elementRow,
                    column: elementColumn,
                },
                size: {
                    rows: 1,
                    columns: 4,
                },
            } as LayoutDataBlob,
            name: "Poster / Image",
            typeName: Content_ElementType_Enum.ImageFile,
            uploadsRemaining: 3,
        });

        elementRow += elementColumn === 8 ? 1 : 0;
        elementColumn = elementColumn === 8 ? 4 : 8;
    }
    if (content.slidesUpload) {
        result.push({
            __outputs: [],
            __remapColumns: ["itemId"],

            __typename: "content_Element",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            data: [] as ElementDataBlob,
            isHidden: false,
            itemId: itemIdOutputName,
            layoutData: {
                contentType: Content_ElementType_Enum.PaperFile,
                wide: false,
                priority: elementPriority++,

                position: {
                    row: elementRow,
                    column: elementColumn,
                },
                size: {
                    rows: 1,
                    columns: 4,
                },
            } as LayoutDataBlob,
            name: "Slides",
            typeName: Content_ElementType_Enum.PaperFile,
            uploadsRemaining: 3,
        });

        elementRow += elementColumn === 8 ? 1 : 0;
        elementColumn = elementColumn === 8 ? 4 : 8;
    }
    if (content.websiteLinkUpload) {
        result.push({
            __outputs: [],
            __remapColumns: ["itemId"],

            __typename: "content_Element",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            data: [] as ElementDataBlob,
            isHidden: false,
            itemId: itemIdOutputName,
            layoutData: {
                contentType: Content_ElementType_Enum.LinkButton,
                wide: false,
                priority: elementPriority++,

                position: {
                    row: elementRow,
                    column: elementColumn,
                },
                size: {
                    rows: 1,
                    columns: 4,
                },
            } as LayoutDataBlob,
            name: "Find out more",
            typeName: Content_ElementType_Enum.LinkButton,
            uploadsRemaining: 3,
        });

        elementRow += elementColumn === 8 ? 1 : 0;
        elementColumn = elementColumn === 8 ? 4 : 8;
    }

    return result;
}

const modeMap: Record<NonNullable<Event<string>["interactionMode"]>, Schedule_Mode_Enum> = {
    "video-chat": Schedule_Mode_Enum.VideoChat,
    "breakout video-chat": Schedule_Mode_Enum.Exhibition,
    "external event": Schedule_Mode_Enum.External,
    networking: Schedule_Mode_Enum.Shuffle,
    "live-stream": Schedule_Mode_Enum.Livestream,
};

function generateEventEntities(
    event: Event<Date | string | null>,
    rootOutputName: string,
    contentOutputName: string | undefined,
    exhibitionOutputName: string | undefined,
    sessionEventOutputName: string | undefined,
    roomOutputName: string,
    options: ProgramImportOptions,
    context: Context
): Entity[] {
    const eventIdOutputName = composeOutputNames(rootOutputName, "id");

    const eventMode = event.interactionMode ?? options.defaultEventMode;
    const shufflePeriodIdOutputName =
        eventMode === "networking" && context.createdBy
            ? composeOutputNames(composeOutputNames(rootOutputName, "shuffle"), "id")
            : undefined;
    const scheduledStartTime = event.start
        ? typeof event.start === "string"
            ? new Date(event.start)
            : event.start
        : null;
    return [
        {
            __outputs: [
                {
                    columnName: "id",
                    outputName: eventIdOutputName,
                },
            ],
            __remapColumns: ["exhibitionId", "itemId", "roomId", "shufflePeriodId", "sessionEventId"],

            __typename: "schedule_Event",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name: event.name,
            itemId: contentOutputName && composeOutputNames(contentOutputName, "id"),
            roomId: composeOutputNames(roomOutputName, "id"),

            scheduledStartTime: event.duration > 0 && scheduledStartTime ? scheduledStartTime.toISOString() : null,
            scheduledEndTime:
                event.duration > 0 && scheduledStartTime
                    ? new Date(scheduledStartTime.getTime() + event.duration * 60 * 1000).toISOString()
                    : null,
            modeName: !sessionEventOutputName ? modeMap[eventMode] : null,
            sessionEventId: sessionEventOutputName ? composeOutputNames(sessionEventOutputName, "id") : undefined,

            exhibitionId: exhibitionOutputName ? composeOutputNames(exhibitionOutputName, "id") : undefined,

            shufflePeriodId: shufflePeriodIdOutputName,

            enableRecording: true,
            automaticParticipationSurvey: true,
        },
        ...event.chairs.map<Entity>((chair, idx) => ({
            __outputs: [
                {
                    columnName: "id",
                    outputName: composeOutputNames(composeOutputNames(rootOutputName, `chairs[${idx}]`), "id"),
                },
            ],
            __remapColumns: [],

            __typename: "collection_ProgramPerson",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name: chair.name,
            affiliation: chair.affiliation,
            email: chair.email,
        })),
        ...event.speakers.map<Entity>((speaker, idx) => ({
            __outputs: [
                {
                    columnName: "id",
                    outputName: composeOutputNames(composeOutputNames(rootOutputName, `speakers[${idx}]`), "id"),
                },
            ],
            __remapColumns: [],

            __typename: "collection_ProgramPerson",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name: speaker.name,
            affiliation: speaker.affiliation,
            email: speaker.email,
        })),
        ...event.chairs.map<Entity>((_, idx) => ({
            __outputs: [],
            __remapColumns: ["eventId", "personId"],

            __typename: "schedule_EventProgramPerson",
            personId: composeOutputNames(composeOutputNames(rootOutputName, `chairs[${idx}]`), "id"),
            eventId: eventIdOutputName,
            roleName: Schedule_EventProgramPersonRole_Enum.Chair,
        })),
        ...event.speakers.map<Entity>((_, idx) => ({
            __outputs: [],
            __remapColumns: ["eventId", "personId"],

            __typename: "schedule_EventProgramPerson",
            eventId: eventIdOutputName,
            personId: composeOutputNames(composeOutputNames(rootOutputName, `speakers[${idx}]`), "id"),
            roleName: Schedule_EventProgramPersonRole_Enum.Presenter,
        })),
        ...(shufflePeriodIdOutputName && scheduledStartTime && event.duration > 0
            ? ([
                  {
                      __outputs: [
                          {
                              columnName: "id",
                              outputName: shufflePeriodIdOutputName,
                          },
                      ],
                      __remapColumns: [],

                      __typename: "room_ShufflePeriod",
                      conferenceId: context.conferenceId,
                      subconferenceId: context.subconferenceId,

                      startAt: scheduledStartTime.toISOString(),
                      endAt: new Date(scheduledStartTime.getTime() + event.duration * 60 * 1000).toISOString(),
                      maxRegistrantsPerRoom: 5,
                      name: event.name,
                      organiserId: context.createdBy,
                      roomDurationMinutes: Math.max(5, event.duration - 1),
                      targetRegistrantsPerRoom: 4,
                      waitRoomMaxDurationSeconds: 60,
                  },
              ] as Entity[])
            : []),
    ];
}

function generateRoomEntities(
    roomName: string,
    itemIdOutputName: string | undefined,
    rootOutputName: string,
    context: Context
): Entity[] {
    const idOutputName = composeOutputNames(rootOutputName, "id");
    return [
        {
            __outputs: [
                {
                    columnName: "id",
                    outputName: idOutputName,
                },
            ],
            __remapColumns: ["itemId"],

            __typename: "room_Room",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            name: roomName,
            itemId: itemIdOutputName,
            managementModeName: Room_ManagementMode_Enum.Public,
            priority: 100,
        },
    ];
}

export function generateExhibitionEntities(
    exhibitionName: string,
    itemIdOutputNames: string[],
    descriptiveItemIdOutputName: string | undefined,
    isHidden: boolean,
    rootOutputName: string,
    context: Context
): Entity[] {
    const exhibitionIdOutputName = composeOutputNames(rootOutputName, "id");
    return [
        {
            __outputs: [
                {
                    columnName: "id",
                    outputName: exhibitionIdOutputName,
                },
            ],
            __remapColumns: ["descriptiveItemId"],

            __typename: "collection_Exhibition",
            conferenceId: context.conferenceId,
            subconferenceId: context.subconferenceId,

            descriptiveItemId: descriptiveItemIdOutputName,
            isHidden,
            name: exhibitionName,
        },
        ...itemIdOutputNames.map<Entity>((itemIdOutputName, idx) => ({
            __outputs: [],
            __remapColumns: ["exhibitionId", "itemId"],

            __typename: "content_ItemExhibition",
            exhibitionId: exhibitionIdOutputName,
            itemId: itemIdOutputName,
            priority: idx,
        })),
    ];
}

export function mergeEntities(entities: Entity[]) {
    // Merge duplicates of some entities: people, tags
    //  - "Merging" just means condensing the output names into a single list
    //  - This is an optimisation to reduce the number of duplicate "apply" tasks
    //    that would otherwise be generated

    const accumulatedTags = new Map<string, Entity>();
    const accumulatedPeople = new Map<string, Entity>();
    const mergedEntities: Entity[] = [];
    for (const entity of entities) {
        if (entity.__typename === "collection_Tag") {
            if (entity.name) {
                const existing = accumulatedTags.get(entity.name);
                if (existing) {
                    existing.__outputs.push(...entity.__outputs);
                } else {
                    accumulatedTags.set(entity.name, entity);
                    mergedEntities.push(entity);
                }
            }
        } else if (entity.__typename === "collection_ProgramPerson") {
            // We're only going to try to merge identical people here
            // - No fancy stuff because this is just an optimisation pass
            // - We'll leave the fancy "match against people of same name/affiliation/email" to the apply step
            const keyHash = crypto.createHash("SHA256").update("person");
            if (entity.name) {
                keyHash.update(entity.name);
            }
            if (entity.affiliation) {
                keyHash.update(entity.affiliation);
            }
            if (entity.email) {
                keyHash.update(entity.email);
            }
            const key = keyHash.digest().toString("hex");
            const existing = accumulatedPeople.get(key);
            if (existing) {
                existing.__outputs.push(...entity.__outputs);
            } else {
                accumulatedPeople.set(key, entity);
                mergedEntities.push(entity);
            }
        } else {
            mergedEntities.push(entity);
        }
    }
    return mergedEntities;
}

export function sortEntities(mergedEntities: Entity[]) {
    return R.sort((x, y) => {
        if (x.__typename === "schedule_Event" && y.__typename === "schedule_Event") {
            if (!x.sessionEventId && y.sessionEventId) {
                return -1;
            } else if (x.sessionEventId && !y.sessionEventId) {
                return 1;
            } else {
                return 0;
            }
        }
        return applyEntitiesOrdering[x.__typename!] - applyEntitiesOrdering[y.__typename!];
    }, mergedEntities);
}

export async function applyEntities(sortedEntities: Entity[], job: ImportJob) {
    await Promise.all(
        sortedEntities.map((entity) => {
            const value: any = {
                ...entity,
            };
            delete value.__typename;
            delete value.__outputs;
            delete value.__remapColumns;
            return publishTask({
                type: "apply",
                data: {
                    outputs: entity.__outputs,
                    remapColumns: entity.__remapColumns,
                    type: entityTypenamesToApplyType[entity.__typename!],
                    value,
                },
                jobId: job.id,
            });
        })
    );
}
