import type { ElementDataBlob } from "@midspace/shared-types/content";
import { Content_ElementType_Enum, isElementDataBlob } from "@midspace/shared-types/content";
import type { ImmediateSwitchExecutedSignal, RtmpSource } from "@midspace/shared-types/video/immediateSwitchData";
import { ImmediateSwitchData } from "@midspace/shared-types/video/immediateSwitchData";
import { gql } from "@urql/core";
import * as R from "ramda";
import type { PropsWithChildren } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createContext } from "use-context-selector";
import type { Event_EventVonageSessionFragment, Room_EventSummaryFragment } from "../../../../../generated/graphql";
import { useLiveIndicator_GetElementQuery, useLiveIndicator_GetLatestQuery } from "../../../../../generated/graphql";
import usePolling from "../../../../Hooks/usePolling";
import { useRealTime } from "../../../../Hooks/useRealTime";
import { useEvent } from "../../../../Utils/useEvent";
import { useVonageGlobalState } from "../Vonage/State/VonageGlobalStateProvider";

gql`
    query LiveIndicator_GetLatest($eventId: uuid!) {
        video_ImmediateSwitch(
            order_by: { executedAt: desc_nulls_last }
            where: { eventId: { _eq: $eventId }, executedAt: { _is_null: false } }
            limit: 1
        ) {
            id
            data
            executedAt
            eventId
        }
    }
`;

interface Props {
    hlsUri?: string;
    event: Room_EventSummaryFragment & Event_EventVonageSessionFragment;
}

function useValue({ hlsUri, event }: Props) {
    const scheduledStartTime = useMemo(() => Date.parse(event.scheduledStartTime), [event.scheduledStartTime]);
    const scheduledEndTime = useMemo(() => Date.parse(event.scheduledEndTime), [event.scheduledEndTime]);
    const realNow = useRealTime(1000);
    const now = realNow + 2000; // adjust for expected RTMP delay
    const live = now >= scheduledStartTime && now <= scheduledEndTime;

    const vonageGlobalState = useVonageGlobalState();
    const [isConnected, setIsConnected] = useState<boolean>(false);
    useEffect(() => {
        const unobserve = vonageGlobalState.IsConnected.subscribe((isConn) => {
            setIsConnected(isConn);
        });
        return () => {
            unobserve();
        };
    }, [vonageGlobalState]);

    const [{ data: latestImmediateSwitchData }, refetchLiveIndicator] = useLiveIndicator_GetLatestQuery({
        variables: {
            eventId: event.id,
        },
        requestPolicy: "network-only",
    });
    const { start: startPolling, stop: stopPolling } = usePolling(refetchLiveIndicator, 20000, isConnected);
    useEffect(() => {
        if (isConnected) {
            startPolling();
        } else {
            stopPolling();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected]);

    const lastRetrievedSwitch = useMemo((): ImmediateSwitchExecutedSignal | null => {
        if (
            !latestImmediateSwitchData?.video_ImmediateSwitch?.length ||
            !latestImmediateSwitchData.video_ImmediateSwitch[0].executedAt
        ) {
            return null;
        }

        const transformed = ImmediateSwitchData.safeParse(latestImmediateSwitchData.video_ImmediateSwitch[0].data);

        if (!transformed.success) {
            console.error("Invalid immediate switch", {
                error: transformed.error,
                data: latestImmediateSwitchData.video_ImmediateSwitch[0].data,
            });
            return null;
        }

        return {
            immediateSwitch: transformed.data,
            executedAtMillis: Date.parse(latestImmediateSwitchData?.video_ImmediateSwitch[0].executedAt),
        };
    }, [latestImmediateSwitchData]);

    const [lastReceivedSwitch, setLastReceivedSwitch] = useState<ImmediateSwitchExecutedSignal | null>(null);
    const receivedSwitch = useCallback(
        (data: ImmediateSwitchExecutedSignal) => {
            console.log("Received immediate switch event", data);
            if (!lastReceivedSwitch?.executedAtMillis || lastReceivedSwitch.executedAtMillis < data.executedAtMillis) {
                setLastReceivedSwitch(data);
            }
        },
        [lastReceivedSwitch?.executedAtMillis]
    );
    useEvent(vonageGlobalState, "immediate-switch-executed-signal-received", receivedSwitch);

    const latestSwitch = useMemo((): ImmediateSwitchExecutedSignal | null => {
        if (lastReceivedSwitch && lastRetrievedSwitch) {
            if (lastReceivedSwitch.executedAtMillis > lastRetrievedSwitch.executedAtMillis) {
                return lastReceivedSwitch;
            } else {
                return lastRetrievedSwitch;
            }
        } else if (lastReceivedSwitch) {
            return lastReceivedSwitch;
        } else if (lastRetrievedSwitch) {
            return lastRetrievedSwitch;
        }
        return null;
    }, [lastReceivedSwitch, lastRetrievedSwitch]);

    const [{ data: _currentElementData }] = useLiveIndicator_GetElementQuery({
        variables: {
            elementId:
                latestSwitch?.immediateSwitch?.kind === "video"
                    ? latestSwitch.immediateSwitch.elementId
                    : event?.autoPlayElement?.id
                    ? event.autoPlayElement.id
                    : null,
        },
        pause: latestSwitch?.immediateSwitch?.kind !== "video",
    });
    const currentElementData = latestSwitch?.immediateSwitch?.kind === "video" ? _currentElementData : undefined;

    const durationCurrentElement = useMemo((): number | null => {
        if (
            currentElementData?.content_Element_by_pk?.data &&
            isElementDataBlob(currentElementData.content_Element_by_pk.data)
        ) {
            const elementDataBlob: ElementDataBlob = currentElementData.content_Element_by_pk.data;
            const latestVersion = R.last(elementDataBlob);
            if (
                !latestVersion ||
                latestVersion.data.type !== Content_ElementType_Enum.VideoBroadcast ||
                !latestVersion.data.broadcastTranscode?.durationSeconds
            ) {
                return null;
            }

            return latestVersion.data.broadcastTranscode.durationSeconds;
        }
        return null;
    }, [currentElementData?.content_Element_by_pk?.data]);

    const currentInput = useMemo(():
        | "filler"
        | "rtmp_push:rtmpEvent"
        | "rtmp_push:rtmpRoom"
        | "video"
        | "video_ending"
        | "video_unknown_duration"
        | null => {
        const eventStartMillis = Date.parse(event.scheduledStartTime);
        if (!latestSwitch || latestSwitch.executedAtMillis < eventStartMillis) {
            if (event.autoPlayElement) {
                if (!durationCurrentElement) {
                    return "video_unknown_duration";
                }
                if (now - eventStartMillis > durationCurrentElement * 1000) {
                    return "filler";
                } else if (now - eventStartMillis > (durationCurrentElement - 10) * 1000) {
                    return "video_ending";
                } else {
                    return "video";
                }
            }
            return "rtmp_push:rtmpEvent";
        }

        const lastSwitch = latestSwitch.immediateSwitch;
        switch (lastSwitch.kind) {
            case "filler":
                return "filler";
            case "rtmp_push": {
                const source: RtmpSource = lastSwitch.source ?? "rtmpEvent";
                return `rtmp_push:${source}`;
            }
            case "video": {
                if (!latestImmediateSwitchData?.video_ImmediateSwitch?.[0]?.executedAt) {
                    return null;
                }
                if (!durationCurrentElement) {
                    return "video_unknown_duration";
                }
                const switchedToVideoAt = Date.parse(latestImmediateSwitchData.video_ImmediateSwitch[0].executedAt);
                if (now - switchedToVideoAt > durationCurrentElement * 1000) {
                    return "rtmp_push:rtmpEvent";
                } else if (now - switchedToVideoAt > (durationCurrentElement - 10) * 1000) {
                    return "video_ending";
                } else {
                    return "video";
                }
            }
        }
    }, [
        latestSwitch,
        event.autoPlayElement,
        event.scheduledStartTime,
        durationCurrentElement,
        now,
        latestImmediateSwitchData?.video_ImmediateSwitch,
    ]);

    const liveOnAir = live && currentInput !== "video" && currentInput !== "filler";

    return {
        hlsUri,
        event,
        scheduledStartTime,
        scheduledEndTime,
        now,
        live,
        liveOnAir,
        currentInput,
        connected: isConnected,
    };
}

export const BackstageContext = createContext({} as ReturnType<typeof useValue>);

export function BackstageProvider(props: PropsWithChildren<Props>): JSX.Element {
    return <BackstageContext.Provider value={useValue(props)}>{props.children}</BackstageContext.Provider>;
}
