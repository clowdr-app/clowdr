import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type {
    VonageVideoPlaybackCommand,
    VonageVideoPlaybackCommandSignal,
} from "@midspace/shared-types/video/vonage-video-playback-command";
import { gql } from "@urql/core";
import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import {
    useVonageVideoPlaybackContext_GetElementQuery,
    useVonageVideoPlaybackContext_InsertCommandMutation,
} from "../../../../../../generated/graphql";
import { makeContext } from "../../../../../GQL/make-context";
import { useConference } from "../../../../useConference";
import useCurrentRegistrant from "../../../../useCurrentRegistrant";
import {
    parseMediaElement,
    parseMediaElementSubtitlesUrl,
    parseMediaElementUrl,
} from "../../../Content/Element/useMediaElement";

gql`
    mutation VonageVideoPlaybackContext_InsertCommand($object: video_VonageVideoPlaybackCommand_insert_input!) {
        insert_video_VonageVideoPlaybackCommand_one(object: $object) {
            id
        }
    }
`;

type Props = {
    vonageSessionId: string;
};

function useValue({ vonageSessionId }: Props) {
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

    const [latestCommand, setLatestCommand] = useState<VonageVideoPlaybackCommandSignal>();
    const receivedCommand = useCallback((command: VonageVideoPlaybackCommandSignal) => {
        setLatestCommand(command);
    }, []);

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
