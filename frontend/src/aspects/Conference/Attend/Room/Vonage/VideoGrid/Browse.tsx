import React, { useMemo } from "react";
import type { Viewport } from "../Components/LayoutTypes";
import { Focus } from "./BrowseLayouts/Focus";
import { Gallery } from "./BrowseLayouts/Gallery";

export function Browse({
    viewports,
    streamActivities,
}: {
    viewports: Viewport[];
    streamActivities: Map<
        string,
        React.MutableRefObject<{
            timestamp: number;
            talking: boolean;
        } | null>
    >;
}): JSX.Element {
    const cameraFeeds = useMemo(() => viewports.filter((x) => x.type === "camera"), [viewports]);
    const screenFeeds = useMemo(() => viewports.filter((x) => x.type === "screen"), [viewports]);

    return screenFeeds.length ? (
        <Focus viewports={cameraFeeds} focusViewports={screenFeeds} />
    ) : (
        <Gallery viewports={cameraFeeds} streamActivities={streamActivities} />
    );
}
