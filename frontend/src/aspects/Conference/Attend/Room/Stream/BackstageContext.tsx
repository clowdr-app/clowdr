import type { ElementDataBlob } from "@midspace/shared-types/content";
import { Content_ElementType_Enum, isElementDataBlob } from "@midspace/shared-types/content";
import { ImmediateSwitchData } from "@midspace/shared-types/video/immediateSwitchData";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import * as R from "ramda";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { createContext } from "use-context-selector";
import type { Event_EventVonageSessionFragment, Room_EventSummaryFragment } from "../../../../../generated/graphql";
import { useLiveIndicator_GetElementQuery, useLiveIndicator_GetLatestQuery } from "../../../../../generated/graphql";
import usePolling from "../../../../Hooks/usePolling";
import { useRealTime } from "../../../../Hooks/useRealTime";
import { useVonageGlobalState } from "../Vonage/State/VonageGlobalStateProvider";

interface Props {
    hlsUri?: string;
    event: Room_EventSummaryFragment & Event_EventVonageSessionFragment;
}

function useValue({ hlsUri, event }: Props) {
    const startTime = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const endTime = useMemo(() => Date.parse(event.endTime), [event.endTime]);
    const realNow = useRealTime(1000);
    const now = realNow + 2000; // adjust for expected RTMP delay
    const live = now >= startTime && now <= endTime;

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
        pause: !isConnected,
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

    const latestSwitchData = useMemo(() => {
        if (!latestImmediateSwitchData?.video_ImmediateSwitch?.length) {
            return null;
        }

        const transformed = plainToClass(ImmediateSwitchData, {
            type: "switch",
            data: latestImmediateSwitchData.video_ImmediateSwitch[0].data,
        });

        const errors = validateSync(transformed);
        if (errors.length) {
            console.error("Invalid immediate switch", { errors, data: transformed });
            return null;
        }

        return transformed;
    }, [latestImmediateSwitchData]);

    const [{ data: _currentElementData }] = useLiveIndicator_GetElementQuery({
        variables: {
            elementId: latestSwitchData?.data.kind === "video" ? latestSwitchData.data.elementId : null,
        },
        pause: latestSwitchData?.data.kind !== "video",
    });
    const currentElementData = latestSwitchData?.data.kind === "video" ? _currentElementData : undefined;

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
        | "rtmp_push"
        | "video"
        | "video_ending"
        | "video_unknown_duration"
        | null => {
        if (!latestSwitchData) {
            return "rtmp_push";
        }

        switch (latestSwitchData.data.kind) {
            case "filler":
                return "filler";
            case "rtmp_push":
                return "rtmp_push";
            case "video": {
                if (!latestImmediateSwitchData?.video_ImmediateSwitch?.[0]?.executedAt) {
                    return null;
                }
                if (!durationCurrentElement) {
                    return "video_unknown_duration";
                }
                const switchedToVideoAt = Date.parse(latestImmediateSwitchData.video_ImmediateSwitch[0].executedAt);
                if (now - switchedToVideoAt > durationCurrentElement * 1000) {
                    return "rtmp_push";
                } else if (now - switchedToVideoAt > (durationCurrentElement - 10) * 1000) {
                    return "video_ending";
                } else {
                    return "video";
                }
            }
        }

        return null;
    }, [durationCurrentElement, latestImmediateSwitchData?.video_ImmediateSwitch, latestSwitchData, now]);

    const liveOnAir = live && currentInput !== "video" && currentInput !== "filler";

    return {
        hlsUri,
        event,
        startTime,
        endTime,
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
