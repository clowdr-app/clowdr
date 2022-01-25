import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type {
    VonageVideoPlaybackCommand,
    VonageVideoPlaybackCommandSignal,
} from "@midspace/shared-types/video/vonage-video-playback-command";
import { vonageVideoPlaybackCommand } from "@midspace/shared-types/video/vonage-video-playback-command";
import { gql } from "@urql/core";
import * as R from "ramda";
import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import type { VonageVideoPlaybackContext_GetLatestCommandQuery } from "../../../../../../generated/graphql";
import {
    useVonageVideoPlaybackContext_GetElementQuery,
    useVonageVideoPlaybackContext_GetLatestCommandQuery,
    useVonageVideoPlaybackContext_InsertCommandMutation,
} from "../../../../../../generated/graphql";
import { makeContext } from "../../../../../GQL/make-context";
import { useEvent } from "../../../../../Utils/useEvent";
import { useConference } from "../../../../useConference";
import useCurrentRegistrant from "../../../../useCurrentRegistrant";
import {
    parseMediaElement,
    parseMediaElementSubtitlesUrl,
    parseMediaElementUrl,
} from "../../../Content/Element/useMediaElement";
import { VonageComputedStateContext } from "../VonageComputedStateContext";
import { useVonageGlobalState } from "../VonageGlobalStateProvider";

gql`
    mutation VonageVideoPlaybackContext_InsertCommand($object: video_VonageVideoPlaybackCommand_insert_input!) {
        insert_video_VonageVideoPlaybackCommand_one(object: $object) {
            id
        }
    }

    query VonageVideoPlaybackContext_GetLatestCommand($vonageSessionId: String!) {
        video_VonageVideoPlaybackCommand(
            where: { vonageSessionId: { _eq: $vonageSessionId } }
            order_by: { createdAt: desc }
            limit: 1
        ) {
            id
            command
            createdByRegistrantId
            createdAt
        }
    }
`;

type Props = {
    vonageSessionId: string;
    canControlPlayback: boolean;
};

function parseStoredCommand(
    result: VonageVideoPlaybackContext_GetLatestCommandQuery
): VonageVideoPlaybackCommandSignal | undefined {
    const latestStored = R.last(result.video_VonageVideoPlaybackCommand);
    if (!latestStored) {
        return undefined;
    }
    const command = vonageVideoPlaybackCommand.safeParse(latestStored?.command);
    if (!command.success) {
        return undefined;
    }
    return {
        command: command.data,
        createdAtMillis: Date.parse(latestStored.createdAt),
        createdByRegistrantId: latestStored.createdByRegistrantId,
    };
}

function useValue({ vonageSessionId, canControlPlayback }: Props) {
    const conference = useConference();
    const registrant = useCurrentRegistrant();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Attendee,
            }),
        []
    );

    const [, insertCommand] = useVonageVideoPlaybackContext_InsertCommandMutation();

    const sendCommand = useCallback(
        async (command: VonageVideoPlaybackCommand) => {
            await insertCommand(
                {
                    object: {
                        command: command,
                        createdByRegistrantId: registrant.id,
                        conferenceId: conference.id,
                        subconferenceId: null,
                        vonageSessionId,
                    },
                },
                context
            );
        },
        [conference.id, context, insertCommand, registrant.id, vonageSessionId]
    );

    const { connected } = useContext(VonageComputedStateContext);
    const [latestCommandResult] = useVonageVideoPlaybackContext_GetLatestCommandQuery({
        variables: {
            vonageSessionId,
        },
        pause: !connected,
        requestPolicy: "network-only",
    });

    const [latestCommand, setLatestCommand] = useState<VonageVideoPlaybackCommandSignal>();
    useEffect(() => {
        if (!latestCommandResult.data) {
            return;
        }
        const storedCommand = parseStoredCommand(latestCommandResult.data);
        if (!storedCommand) {
            return;
        }
        if (!latestCommand || storedCommand.createdAtMillis > latestCommand.createdAtMillis) {
            setLatestCommand(storedCommand);
        }
    }, [latestCommand, latestCommandResult.data]);

    const receivedCommand = useCallback(
        (command: VonageVideoPlaybackCommandSignal) => {
            if (!latestCommand || command.createdAtMillis > latestCommand.createdAtMillis) {
                setLatestCommand(command);
            }
        },
        [latestCommand]
    );

    const vonage = useVonageGlobalState();
    useEvent(vonage, "video-playback-signal-received", receivedCommand);

    gql`
        query VonageVideoPlaybackContext_GetElement($elementId: uuid!) {
            content_Element_by_pk(id: $elementId) {
                id
                ...useMediaElement_MediaElement
            }
        }
    `;

    const [{ data, error: queryError }] = useVonageVideoPlaybackContext_GetElementQuery({
        variables: {
            elementId: latestCommand?.command?.type === "video" ? latestCommand.command.elementId : null,
        },
        pause: latestCommand?.command?.type !== "video",
    });

    const { mediaElementBlob, error: parseBlobError } = parseMediaElement(data?.content_Element_by_pk ?? undefined);

    const video = useMemo(
        () => (mediaElementBlob ? parseMediaElementUrl(mediaElementBlob) : undefined),
        [mediaElementBlob]
    );
    const subtitles = useAsync(async () => {
        if (mediaElementBlob) {
            return await parseMediaElementSubtitlesUrl(mediaElementBlob);
        } else {
            return undefined;
        }
    }, []);

    const errors = useMemo(
        () => ({
            queryError,
            parseBlobError,
            videoUrlError: video?.error,
            subtitlesUrlError: subtitles?.error,
        }),
        [parseBlobError, queryError, subtitles?.error, video?.error]
    );

    return {
        receivedCommand,
        sendCommand,
        latestCommand,
        video,
        subtitles,
        errors,
        canControlPlayback,
    };
}

export const VonageVideoPlaybackContext = createContext({} as ReturnType<typeof useValue>);

export function VonageVideoPlaybackProvider(props: PropsWithChildren<Props>): JSX.Element {
    return (
        <VonageVideoPlaybackContext.Provider value={useValue(props)}>
            {props.children}
        </VonageVideoPlaybackContext.Provider>
    );
}
