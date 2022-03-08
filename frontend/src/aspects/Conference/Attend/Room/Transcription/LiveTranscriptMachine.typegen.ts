// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
    "@@xstate/typegen": true;
    eventsCausingActions: {
        updateMediaStreamTrack: "MEDIA_CHANGED";
        updateWebSocket: "done.invoke.toggle.initialisingWebSocket:invocation[0]";
        updateAudioGraph: "done.invoke.toggle.initialisingAudioContext:invocation[0]";
    };
    internalEvents: {
        "done.invoke.toggle.initialisingWebSocket:invocation[0]": {
            type: "done.invoke.toggle.initialisingWebSocket:invocation[0]";
            data: unknown;
            __tip: "See the XState TS docs to learn how to strongly type this.";
        };
        "done.invoke.toggle.initialisingAudioContext:invocation[0]": {
            type: "done.invoke.toggle.initialisingAudioContext:invocation[0]";
            data: unknown;
            __tip: "See the XState TS docs to learn how to strongly type this.";
        };
        "xstate.init": { type: "xstate.init" };
    };
    invokeSrcNameMap: {
        initialiseWebSocket: "done.invoke.toggle.initialisingWebSocket:invocation[0]";
        initialiseAudioContext: "done.invoke.toggle.initialisingAudioContext:invocation[0]";
    };
    missingImplementations: {
        actions: never;
        services: never;
        guards: never;
        delays: never;
    };
    eventsCausingServices: {
        initialiseWebSocket: "MEDIA_CHANGED";
        initialiseAudioContext: "done.invoke.toggle.initialisingWebSocket:invocation[0]";
    };
    eventsCausingGuards: {};
    eventsCausingDelays: {};
    matchesStates: "inactive" | "initialisingWebSocket" | "initialisingAudioContext" | "running" | "error";
    tags: never;
}
