import type {
    Author,
    Chair,
    Content,
    DataWithValidation,
    ErrorAnnotation,
    Event,
    Exhibition,
    Presentation,
    RawRecord,
    Session,
    Speaker,
    WithErrors,
} from "@midspace/shared-types/import/program";
import { anyErrors } from "@midspace/shared-types/import/program";
import React, { useEffect, useMemo, useState } from "react";
import type { ParsedData } from "../../../../../Files/useCSVJSONXMLParser";
import Step from "./Step";

const interactionModes: Event<string>["interactionMode"][] = [
    "video-chat",
    "networking",
    "breakout video-chat",
    "external event",
    "live-stream",
];

interface Repair {
    fileName: string;
    rowIndex: number;
    type: "session" | "exhibition";
    // TODO: Repair description
}

export default function FixIssuesStep({
    data,
    onRepairedData,
    onNextStep,
    onPreviousStep,
    onCanProceedChange,
}: {
    data: ParsedData<RawRecord[]>[] | undefined;
    onRepairedData?: (data: ParsedData<DataWithValidation>[] | undefined) => void;
    onNextStep?: () => void;
    onPreviousStep?: () => void;
    onCanProceedChange?: (canProceed: boolean) => void;
    isActive: boolean;
}): JSX.Element {
    const initiallyProcessedData = useMemo(() => (data ? processData(data) : []), [data]);
    const [repairs, _setRepairs] = useState<Repair[]>([]);
    const repairedData = useMemo(
        () => applyRepairs(initiallyProcessedData, repairs),
        [initiallyProcessedData, repairs]
    );
    useEffect(() => {
        onRepairedData?.(repairedData);
    }, [onRepairedData, repairedData]);

    const areAnyErrors = repairedData.some((x) =>
        "error" in x ? true : anyErrors<Session, RawRecord>(x.data.sessions) || anyErrors(x.data.exhibitions)
    );
    const canProceed = !areAnyErrors && Boolean(repairedData?.length);
    useEffect(() => {
        onCanProceedChange?.(canProceed);
    }, [onCanProceedChange, canProceed]);

    return (
        <Step
            onNextStep={onNextStep}
            isNextStepEnabled={!areAnyErrors && Boolean(data?.length)}
            onPreviousStep={onPreviousStep}
            isPreviousStepEnabled={true}
        ></Step>
    );
}

function processData(datasets: ParsedData<RawRecord[]>[]): ParsedData<DataWithValidation>[] {
    const results: ParsedData<DataWithValidation>[] = [];

    for (const dataset of datasets) {
        if ("data" in dataset) {
            const sessions: ErrorAnnotation<WithErrors<Session> | RawRecord>[] = [];
            const exhibitions: ErrorAnnotation<WithErrors<Exhibition>>[] = [];

            const result: ParsedData<DataWithValidation> = {
                fileName: dataset.fileName,
                data: {
                    sessions,
                    exhibitions,
                },
            };
            results.push(result);

            let session: ErrorAnnotation<WithErrors<Session>> | null = null;
            let exhibition: ErrorAnnotation<WithErrors<Exhibition>> | null = null;
            for (const record of dataset.data) {
                const maybeNewSessionOrExhibition = processSessionOrExhibitionData(record);
                if (maybeNewSessionOrExhibition) {
                    if (session) {
                        sessions.push(session);
                    }
                    if (exhibition) {
                        exhibitions.push(exhibition);
                    }

                    session = null;
                    exhibition = null;

                    if ("session" in maybeNewSessionOrExhibition) {
                        if ("error" in maybeNewSessionOrExhibition.session) {
                            sessions.push(maybeNewSessionOrExhibition.session);
                        } else {
                            session = maybeNewSessionOrExhibition.session;
                        }
                    } else {
                        if ("error" in maybeNewSessionOrExhibition.exhibition) {
                            exhibitions.push(maybeNewSessionOrExhibition.exhibition);
                        } else {
                            exhibition = maybeNewSessionOrExhibition.exhibition;
                        }
                    }
                }

                if (!session && !exhibition) {
                    sessions.push({
                        error: "Unable to process record. The data did not fit any of the expected formats.",
                        value: record,
                    });
                } else if (session) {
                    if (session.value && typeof session.value !== "string") {
                        const maybePresentation = processPresentation(record);
                        if (maybePresentation) {
                            if ("presentation" in maybePresentation) {
                                session.value.presentations.push(maybePresentation.presentation);
                            } else if ("item" in maybePresentation) {
                                session.value.items.push(maybePresentation.item);
                            }
                        }
                    }
                } else if (exhibition) {
                    if (exhibition.value && typeof exhibition.value !== "string") {
                        const maybeItem = processPresentationContent(record);
                        if (maybeItem) {
                            exhibition.value.items.push(maybeItem);
                        }
                    }
                }
            }
            if (session) {
                sessions.push(session);
            }
            if (exhibition) {
                exhibitions.push(exhibition);
            }

            // TODO: Validate sessions (e.g. timings)
        } else {
            results.push({
                fileName: dataset.fileName,
                error: dataset.error,
            });
        }
    }

    return results;
}

function processSessionOrExhibitionData(
    record: RawRecord
):
    | { session: ErrorAnnotation<WithErrors<Session>> }
    | { exhibition: ErrorAnnotation<WithErrors<Exhibition>> }
    | undefined {
    const content = processSessionContent(record);
    if (!content) {
        return undefined;
    }

    if ("error" in content) {
        return undefined;
    }

    const event = processSessionEvent(record);

    if (event) {
        return {
            session: {
                value: {
                    content,
                    event,
                    items: [],
                    presentations: [],
                },
            },
        };
    } else {
        return {
            exhibition: {
                value: {
                    content,
                    items: [],
                },
            },
        };
    }
}

function processSessionContent(record: RawRecord): ErrorAnnotation<WithErrors<Content>> | undefined {
    if (record.sessionTitle?.length) {
        const chairs = processSessionChairs(record);
        const speakers = !record.presentationTitle?.length ? processPresentationSpeakers(record) : [];
        const authors: ErrorAnnotation<WithErrors<Author>>[] = !record.presentationTitle?.length
            ? record.authors
                  .filter((name) => name.length)
                  .map((name) => ({
                      value: {
                          name: { value: name },
                      },
                  }))
            : [];

        return {
            value: {
                title: { value: record.sessionTitle },
                abstract: { value: record.sessionAbstract ?? "" },
                type:
                    !record.presentationTitle?.length && record.presentationType
                        ? { value: record.presentationType as Content["type"] }
                        : { value: "Session" },

                authors,
                chairs,
                speakers,

                editableAbstract: { value: false },
                imageOrPosterUpload: { value: false },
                slidesUpload: { value: false },
                videoUpload: { value: false },
                websiteLinkUpload: { value: false },

                tags: record.tags.map((tag) => ({ value: tag })),
            },
        };
    }

    return undefined;
}

function processSessionEvent(record: RawRecord): ErrorAnnotation<WithErrors<Event<Date>>> | undefined {
    if (record.sessionStart || (record.sessionDuration !== undefined && record.sessionDuration !== null)) {
        const chairs = processSessionChairs(record);
        const speakers = !record.presentationTitle?.length ? processPresentationSpeakers(record) : [];
        let start: ErrorAnnotation<Date> = {
            error: "No start date/time",
        };
        try {
            if (record.sessionStart?.length) {
                start = {
                    value: new Date(record.sessionStart),
                };
            }
        } catch (e: any) {
            start = {
                error: "Unable to parse date",
                value: record.sessionStart,
            };
        }

        return {
            value: {
                name: record.sessionTitle?.length ? { value: record.sessionTitle } : { error: "No session title" },
                start,
                duration:
                    record.sessionDuration !== undefined && record.sessionDuration !== null
                        ? record.sessionDuration > 0
                            ? { value: record.sessionDuration }
                            : { error: "Session duration must be greater than 0" }
                        : { error: "No session duration" },
                chairs,
                speakers,
                interactionMode: (record.interactionMode?.length
                    ? interactionModes.includes(record.interactionMode as Event<string>["interactionMode"])
                        ? { value: record.interactionMode }
                        : { error: "Invalid interaction mode", value: record.interactionMode }
                    : { value: null }) as { value: Event<string>["interactionMode"] },
                roomName: { value: record.sessionRoomName },
            },
        };
    }
    return undefined;
}

function processSessionChairs(record: RawRecord): ErrorAnnotation<WithErrors<Chair>>[] {
    const chairs: ErrorAnnotation<WithErrors<Chair>>[] = [];
    for (let idx = 0; idx < record.chairNames.length; idx++) {
        const name = record.chairNames[idx];
        const email = record.chairEmails[idx];
        if (name?.length && email?.length) {
            chairs.push({
                value: {
                    name: { value: name },
                    email: { value: email },
                },
            });
        } else {
            chairs.push({
                value: {
                    name: !name?.length ? { error: "No name", value: name } : { value: name },
                    email: !email?.length ? { error: "No email", value: email } : { value: email },
                },
            });
        }
    }
    return chairs;
}

function processPresentation(
    record: RawRecord
):
    | { presentation: ErrorAnnotation<WithErrors<Presentation>> }
    | { item: ErrorAnnotation<WithErrors<Content>> }
    | undefined {
    const content = processPresentationContent(record);

    if (!content) {
        return undefined;
    }

    const event = processPresentationEvent(record);

    if (event) {
        return {
            presentation: {
                value: {
                    content,
                    event,
                },
            },
        };
    } else {
        return {
            item: content,
        };
    }
}

function processPresentationContent(record: RawRecord): ErrorAnnotation<WithErrors<Content>> | undefined {
    if (record.presentationTitle?.length) {
        const speakers = processPresentationSpeakers(record);
        const authors: ErrorAnnotation<WithErrors<Author>>[] = record.authors
            .filter((name) => name.length)
            .map((name) => ({
                value: {
                    name: { value: name },
                },
            }));

        return {
            value: {
                title: record.presentationTitle?.length
                    ? { value: record.presentationTitle }
                    : { error: "No presentation title" },
                abstract: { value: record.presentationAbstract ?? "" },
                type: record.presentationType?.length
                    ? { value: record.presentationType as Content["type"] }
                    : { error: "No presentation type" },

                authors,
                chairs: [],
                speakers,

                editableAbstract: { value: record.editableAbstract },
                imageOrPosterUpload: { value: record.imageOrPosterUpload },
                slidesUpload: { value: record.slidesUpload },
                videoUpload: { value: record.videoUpload },
                websiteLinkUpload: { value: record.websiteLinkUpload },

                tags: record.tags.map((tag) => ({ value: tag })),
            },
        };
    }

    return undefined;
}

function processPresentationEvent(record: RawRecord): ErrorAnnotation<WithErrors<Event<null>>> | undefined {
    if (record.presentationDuration !== undefined && record.presentationDuration !== null) {
        const speakers = processPresentationSpeakers(record);

        return {
            value: {
                name: record.presentationTitle?.length
                    ? { value: record.presentationTitle }
                    : { error: "No presentation title" },
                start: { value: null },
                duration:
                    record.presentationDuration > 0
                        ? { value: record.presentationDuration }
                        : { error: "Presentation duration must be blank or greater than 0" },
                chairs: [],
                speakers,
                interactionMode: (record.interactionMode?.length
                    ? interactionModes.includes(record.interactionMode as Event<string>["interactionMode"])
                        ? { value: record.interactionMode }
                        : { error: "Invalid interaction mode", value: record.interactionMode }
                    : { value: null }) as { value: Event<string>["interactionMode"] },
            },
        };
    }
    return undefined;
}

function processPresentationSpeakers(record: RawRecord): ErrorAnnotation<WithErrors<Speaker>>[] {
    const speakers: ErrorAnnotation<WithErrors<Speaker>>[] = [];
    for (let idx = 0; idx < record.speakerNames.length; idx++) {
        const name = record.speakerNames[idx];
        const affiliation = record.speakerAffiliations[idx] ?? "";
        const email = record.speakerEmails[idx];
        if (name?.length && affiliation && email?.length) {
            speakers.push({
                value: {
                    name: { value: name },
                    affiliation: { value: affiliation },
                    email: { value: email },
                },
            });
        } else {
            speakers.push({
                value: {
                    name: !name?.length ? { error: "No name", value: name } : { value: name },
                    affiliation: { value: affiliation },
                    email: !email?.length ? { error: "No email", value: email } : { value: email },
                },
            });
        }
    }
    return speakers;
}

function applyRepairs(data: ParsedData<DataWithValidation>[], _repairs: Repair[]): ParsedData<DataWithValidation>[] {
    // TODO
    return [...data];
}
