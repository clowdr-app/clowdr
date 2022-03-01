import type { Event } from "./program";

export interface ProgramImportOptions {
    eventImportMode: "session" | "presentation";
    tagPresentationsBySession: "yes" | "no";
    speakerRoleName: "AUTHOR" | "PRESENTER" | "DISCUSSANT";
    defaultEventMode: NonNullable<Event<null>["interactionMode"]>;
}
