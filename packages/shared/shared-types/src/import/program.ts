export interface RawRecord {
    presentationAbstract: string;
    chairEmails: string[];
    chairNames: string[];
    presentationDuration: number | null;
    editableAbstract: boolean;
    imageOrPosterUpload: boolean;
    interactionMode: Event<string>["interactionMode"];
    authors: string[];
    sessionRoomName?: string;
    sessionAbstract?: string;
    sessionDuration?: number;
    sessionStart?: string;
    sessionTitle?: string;
    slidesUpload: boolean;
    speakerAffiliations: string[];
    speakerEmails: string[];
    speakerNames: string[];
    tags: string[];
    presentationTitle: string | null;
    presentationType: string | null;
    videoUpload: boolean;
    websiteLinkUpload: boolean;
}

export interface Chair {
    name: string;
    affiliation?: string;
    email: string;
}

export interface Speaker {
    name: string;
    affiliation?: string;
    email?: string;
}

export interface Author {
    name: string;
    affiliation?: string;
    email?: string;
}

export interface Content {
    chairs: Chair[];
    speakers: Speaker[];
    authors: Author[];

    abstract: string;
    title?: string | null;
    type?:
        | "Demonstration"
        | "Keynote"
        | "Other"
        | "Paper"
        | "Poster"
        | "Presentation"
        | "Session Q&A"
        | "Social"
        | "Symposium"
        | "Tutorial"
        | "Workshop"
        | "Session"
        | null;

    tags: string[];

    editableAbstract: boolean;
    imageOrPosterUpload: boolean;
    slidesUpload: boolean;
    videoUpload: boolean;
    websiteLinkUpload: boolean;
}

export interface Event<StartType extends string | Date | null> {
    chairs: Chair[];
    speakers: Speaker[];

    duration: number;
    start: StartType;
    name: string;

    interactionMode: "video-chat" | "live-stream" | "networking" | "breakout video-chat" | "external event" | null;
    roomName?: string;
}

export interface Presentation {
    content: Content;
    event: Event<null>;
}

export interface Session {
    content: Content;
    event: Event<Date | string>;

    presentations: Presentation[];
}

export interface Exhibition {
    content: Content;

    items: Content[];
}

export type ErrorAnnotation<T> =
    | {
          error: Error | string;
          value?: T | string;
      }
    | {
          value: T;
      };

export type Primitive = number | string | boolean | Date;

export type WithErrors<T> =
    | {
          [K in keyof T]: T[K] extends Primitive
              ? ErrorAnnotation<T[K]>
              : T[K] extends Array<infer S>
              ? S extends Primitive
                  ? Array<ErrorAnnotation<S>>
                  : Array<ErrorAnnotation<WithErrors<S>>>
              : ErrorAnnotation<WithErrors<T[K]>>;
      };

export function anyErrors<T = any, S = any>(records: ErrorAnnotation<WithErrors<T> | S>[]): boolean {
    for (const record of records) {
        if (anyAnnotatedErrors(record)) {
            return true;
        }
    }
    return false;
}

export function anyAnnotatedErrors<T = any, S = any>(record: ErrorAnnotation<WithErrors<T> | S>): boolean {
    if ("error" in record) {
        return true;
    } else {
        if (_anyErrors(record.value)) {
            return true;
        }
    }
    return false;
}

function _anyErrors<T = any, S = any>(record: WithErrors<T> | S): boolean {
    if (!record || typeof record !== "object" || record instanceof Date) {
        return false;
    }

    if (record instanceof Array) {
        return anyErrors(record);
    }

    const x: any = record;
    for (const key in x) {
        if ("error" in x[key]) {
            return true;
        }
        if ("value" in x[key]) {
            if (_anyErrors(x[key].value)) {
                return true;
            }
        }
    }

    return false;
}

export interface DataWithValidation {
    sessions: ErrorAnnotation<WithErrors<Session> | RawRecord>[];
    exhibitions: ErrorAnnotation<WithErrors<Exhibition>>[];
}

export interface ValidatedData {
    sessions: Session[];
    exhibitions: Exhibition[];
}

export interface PresentationWithAllocatedTime {
    content: Content;
    event: Event<Date | null>;
}
