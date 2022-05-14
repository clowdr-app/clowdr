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
import { VonageComputedStateContext } from "../State/VonageComputedStateContext";
import { useVonageGlobalState } from "../State/VonageGlobalStateProvider";
import type { RecordingControlRoles } from "../State/VonageRoomProvider";
import { RecordingControlRole } from "../State/VonageRoomProvider";

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
            vonageSessionId
        }
    }
`;

type Props = {
    vonageSessionId: string;
    canControlPlaybackAs: RecordingControlRoles;
};

function parseStoredCommand(
    result: VonageVideoPlaybackContext_GetLatestCommandQuery
): [signal: VonageVideoPlaybackCommandSignal, vonageSessionId: string] | undefined {
    const latestStored = R.last(result.video_VonageVideoPlaybackCommand);
    if (!latestStored) {
        return undefined;
    }
    const command = vonageVideoPlaybackCommand.safeParse(latestStored?.command);
    if (!command.success) {
        return undefined;
    }
    return [
        {
            command: command.data,
            createdAtMillis: Date.parse(latestStored.createdAt),
            createdByRegistrantId: latestStored.createdByRegistrantId,
        },
        latestStored.vonageSessionId,
    ];
}

function useValue({ vonageSessionId, canControlPlaybackAs }: Props) {
    const conference = useConference();
    const registrant = useCurrentRegistrant();
    const [context, subconferenceId] = useMemo(() => {
        if (canControlPlaybackAs.some((x) => x.role === RecordingControlRole.ConferenceOrganizer)) {
            return [
                makeContext({
                    [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                }),
                null,
            ];
        }
        if (canControlPlaybackAs.some((x) => x.role === RecordingControlRole.SubconferenceOrganizer)) {
            const role = canControlPlaybackAs.find((x) => x.role === RecordingControlRole.SubconferenceOrganizer);
            if (role?.role === RecordingControlRole.SubconferenceOrganizer) {
                return [
                    makeContext({
                        [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                        [AuthHeader.SubconferenceId]: role.subconferenceId,
                    }),
                    role.subconferenceId,
                ];
            }
        }
        return [
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Attendee,
            }),
            null,
        ];
    }, [canControlPlaybackAs]);

    const [, insertCommand] = useVonageVideoPlaybackContext_InsertCommandMutation();

    const sendCommand = useCallback(
        async (command: VonageVideoPlaybackCommand) => {
            await insertCommand(
                {
                    object: {
                        command: command,
                        createdByRegistrantId: registrant.id,
                        conferenceId: conference.id,
                        subconferenceId,
                        vonageSessionId,
                    },
                },
                context
            );
        },
        [conference.id, context, insertCommand, registrant.id, subconferenceId, vonageSessionId]
    );

    const { connected } = useContext(VonageComputedStateContext);
    const [latestCommandResult] = useVonageVideoPlaybackContext_GetLatestCommandQuery({
        variables: {
            vonageSessionId,
        },
        pause: !connected,
        requestPolicy: "network-only",
    });

    const [latestCommandData, setLatestCommandData] = useState<
        [signal: VonageVideoPlaybackCommandSignal, vonageSessionId: string] | null
    >(null);
    useEffect(() => {
        setLatestCommandData(null);
    }, [vonageSessionId]);
    useEffect(() => {
        if (!connected || !latestCommandResult.data) {
            return;
        }
        const storedCommand = parseStoredCommand(latestCommandResult.data);
        if (!storedCommand) {
            return;
        }
        if (
            vonageSessionId === storedCommand[1] &&
            (!latestCommandData || storedCommand[0].createdAtMillis > latestCommandData[0].createdAtMillis)
        ) {
            setLatestCommandData(storedCommand);
        }
    }, [connected, latestCommandData, latestCommandResult.data, vonageSessionId]);

    const receivedCommand = useCallback(
        (command: VonageVideoPlaybackCommandSignal, commandVonageSessionId: string) => {
            if (
                vonageSessionId === commandVonageSessionId &&
                (!latestCommandData || command.createdAtMillis > latestCommandData[0]?.createdAtMillis)
            ) {
                setLatestCommandData([command, vonageSessionId]);
            }
        },
        [latestCommandData, vonageSessionId]
    );

    const vonage = useVonageGlobalState();
    useEvent(vonage, "video-playback-signal-received", receivedCommand);

    gql`
        query VonageVideoPlaybackContext_GetElement($elementId: uuid!) @cached {
            content_Element_by_pk(id: $elementId) {
                id
                ...useMediaElement_MediaElement
            }
        }
    `;

    const [{ data, error: queryError }] = useVonageVideoPlaybackContext_GetElementQuery({
        variables: {
            elementId:
                latestCommandData?.[0]?.command?.type === "video" ? latestCommandData[0].command.elementId : null,
        },
        pause: latestCommandData?.[0]?.command?.type !== "video",
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

    const latestCommand = useMemo(() => latestCommandData?.[0] ?? null, [latestCommandData]);

    return useMemo(
        () => ({
            receivedCommand,
            sendCommand,
            latestCommand,
            video,
            subtitles,
            errors,
            canControlPlaybackAs,
        }),
        [canControlPlaybackAs, errors, latestCommand, receivedCommand, sendCommand, subtitles, video]
    );
}

export const VonageVideoPlaybackContext = createContext({} as ReturnType<typeof useValue>);

export function VonageVideoPlaybackProvider(props: PropsWithChildren<Props>): JSX.Element {
    return (
        <VonageVideoPlaybackContext.Provider value={useValue(props)}>
            {props.children}
        </VonageVideoPlaybackContext.Provider>
    );
}
