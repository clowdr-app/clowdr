/* eslint-disable no-inner-declarations */
import {
    ParticipantPlacement,
    VonageSessionLayoutData,
    VonageSessionLayoutType,
} from "@clowdr-app/shared-types/build/vonage";
import * as R from "ramda";
import { useMemo } from "react";
import { Viewport, VisualLayout, VisualLayoutType } from "./LayoutTypes";

export default function useVisualLayout(
    layout: VonageSessionLayoutData,
    isRecordingMode: boolean,
    viewports: Viewport[]
): VisualLayout {
    const result = useMemo<VisualLayout>(() => {
        let result: VisualLayout | undefined;

        switch (layout.type) {
            case VonageSessionLayoutType.BestFit: {
                if (isRecordingMode) {
                    if (viewports.some((vp) => vp.type === "screen")) {
                        const screenshareViewport = R.sortBy(
                            (x) => x.joinedAt,
                            viewports.filter((vp) => vp.type === "screen")
                        )[0];
                        const priorityViewports = R.sortWith(
                            [
                                (x, y) => {
                                    if (screenshareViewport) {
                                        const xIsPreferred =
                                            (screenshareViewport.streamId &&
                                                !!x.associatedIds?.includes(screenshareViewport.streamId)) ||
                                            !!x.associatedIds?.includes(screenshareViewport.connectionId);
                                        const yIsPreferred =
                                            (screenshareViewport.streamId &&
                                                !!y.associatedIds?.includes(screenshareViewport.streamId)) ||
                                            !!y.associatedIds?.includes(screenshareViewport.connectionId);
                                        if (xIsPreferred) {
                                            return yIsPreferred ? 0 : -1;
                                        } else {
                                            return yIsPreferred ? 1 : 0;
                                        }
                                    }
                                    return 0;
                                },
                                (x, y) => x.joinedAt - y.joinedAt,
                            ],
                            viewports.filter((vp) => vp.type !== "screen")
                        ).slice(0, 5);
                        result = {
                            type:
                                layout.screenShareType === "horizontalPresentation"
                                    ? VisualLayoutType.BestFit_Screenshare_HorizontalSplit
                                    : VisualLayoutType.BestFit_Screenshare_VerticalSplit,
                            screenshareViewport,
                            viewports: priorityViewports,
                            overflowViewports: viewports.filter(
                                (vp) => vp !== screenshareViewport && !priorityViewports.includes(vp)
                            ),
                        };
                    } else {
                        const priorityViewports = R.sortBy((x) => x.joinedAt, viewports).slice(0, 16);
                        result = {
                            type: VisualLayoutType.BestFit_NoScreenshare,
                            viewports: priorityViewports,
                            overflowViewports: viewports.filter((vp) => !priorityViewports.includes(vp)),
                        };
                    }
                } else {
                    result = {
                        type: VisualLayoutType.BestFit_NoScreenshare,
                        viewports: [],
                        overflowViewports: viewports,
                    };
                }
                break;
            }
            case VonageSessionLayoutType.Single: {
                let viewport: Viewport | undefined;
                if (layout.position1) {
                    if ("streamId" in layout.position1) {
                        const streamId = layout.position1.streamId;
                        viewport = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position1.connectionId;
                        viewport = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }
                }

                const overflowViewports = viewports.filter((vp) => vp !== viewport);
                result = {
                    type: VisualLayoutType.Single,
                    viewport,
                    overflowViewports,
                };
                break;
            }
            case VonageSessionLayoutType.Pair: {
                let leftViewport: Viewport | undefined;
                let rightViewport: Viewport | undefined;
                if (layout.position1) {
                    if ("streamId" in layout.position1) {
                        const streamId = layout.position1.streamId;
                        leftViewport = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position1.connectionId;
                        leftViewport = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }
                }

                if (layout.position2) {
                    if ("streamId" in layout.position2) {
                        const streamId = layout.position2.streamId;
                        rightViewport = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position2.connectionId;
                        rightViewport = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }

                    if (rightViewport === leftViewport) {
                        rightViewport = undefined;
                    }
                }

                const overflowViewports = viewports.filter((vp) => vp !== leftViewport && vp !== rightViewport);
                result = {
                    type: VisualLayoutType.Pair,
                    leftViewport,
                    rightViewport,
                    overflowViewports,
                };
                break;
            }
            case VonageSessionLayoutType.PictureInPicture: {
                let fullscreenViewport: Viewport | undefined;
                let insetViewport: Viewport | undefined;
                if (layout.position1) {
                    if ("streamId" in layout.position1) {
                        const streamId = layout.position1.streamId;
                        fullscreenViewport = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position1.connectionId;
                        fullscreenViewport = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }
                }

                if (layout.position2) {
                    if ("streamId" in layout.position2) {
                        const streamId = layout.position2.streamId;
                        insetViewport = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position2.connectionId;
                        insetViewport = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }

                    if (insetViewport === fullscreenViewport) {
                        insetViewport = undefined;
                    }
                }

                const overflowViewports = viewports.filter((vp) => vp !== fullscreenViewport && vp !== insetViewport);
                result = {
                    type: VisualLayoutType.PictureInPicture,
                    fullscreenViewport,
                    insetViewport,
                    overflowViewports,
                };
                break;
            }
            case VonageSessionLayoutType.Fitted4: {
                let largeAreaViewport: Viewport | undefined;
                const sideAreaViewports: Viewport[] = [];
                if (layout.position1) {
                    if ("streamId" in layout.position1) {
                        const streamId = layout.position1.streamId;
                        largeAreaViewport = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position1.connectionId;
                        largeAreaViewport = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }
                }

                function processPlacement(position: ParticipantPlacement) {
                    if (position) {
                        let tempViewport: Viewport | undefined;
                        if ("streamId" in position) {
                            const streamId = position.streamId;
                            tempViewport = viewports.find((viewport) => viewport.streamId === streamId);
                        } else {
                            const connectionId = position.connectionId;
                            tempViewport = viewports.find(
                                (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                            );
                        }

                        if (
                            tempViewport &&
                            tempViewport !== largeAreaViewport &&
                            !sideAreaViewports.includes(tempViewport)
                        ) {
                            sideAreaViewports.push(tempViewport);
                        }
                    }
                }

                processPlacement(layout.position2);
                processPlacement(layout.position3);
                processPlacement(layout.position4);
                processPlacement(layout.position5);

                const overflowViewports = viewports.filter(
                    (vp) => vp !== largeAreaViewport && !sideAreaViewports.includes(vp)
                );
                result = {
                    type: layout.side === "left" ? VisualLayoutType.Fitted4_Left : VisualLayoutType.Fitted4_Bottom,
                    largeAreaViewport,
                    sideAreaViewports,
                    overflowViewports,
                };
                break;
            }
            case VonageSessionLayoutType.DualScreen: {
                let largeAreaViewport1: Viewport | undefined;
                let largeAreaViewport2: Viewport | undefined;
                const sideAreaViewports: Viewport[] = [];
                if (layout.position1) {
                    if ("streamId" in layout.position1) {
                        const streamId = layout.position1.streamId;
                        largeAreaViewport1 = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position1.connectionId;
                        largeAreaViewport1 = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }
                }
                if (layout.position2) {
                    if ("streamId" in layout.position2) {
                        const streamId = layout.position2.streamId;
                        largeAreaViewport2 = viewports.find((viewport) => viewport.streamId === streamId);
                    } else {
                        const connectionId = layout.position2.connectionId;
                        largeAreaViewport2 = viewports.find(
                            (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                        );
                    }
                }

                function processPlacement(position: ParticipantPlacement) {
                    if (position) {
                        let tempViewport: Viewport | undefined;
                        if ("streamId" in position) {
                            const streamId = position.streamId;
                            tempViewport = viewports.find((viewport) => viewport.streamId === streamId);
                        } else {
                            const connectionId = position.connectionId;
                            tempViewport = viewports.find(
                                (viewport) => !viewport.streamId && viewport.connectionId === connectionId
                            );
                        }

                        if (
                            tempViewport &&
                            tempViewport !== largeAreaViewport1 &&
                            tempViewport !== largeAreaViewport2 &&
                            !sideAreaViewports.includes(tempViewport)
                        ) {
                            sideAreaViewports.push(tempViewport);
                        }
                    }
                }

                processPlacement(layout.position3);
                processPlacement(layout.position4);
                processPlacement(layout.position5);
                processPlacement(layout.position6);

                const overflowViewports = viewports.filter(
                    (vp) => vp !== largeAreaViewport1 && vp !== largeAreaViewport2 && !sideAreaViewports.includes(vp)
                );
                result = {
                    type:
                        layout.splitDirection === "horizontal"
                            ? VisualLayoutType.DualScreen_Horizontal
                            : VisualLayoutType.DualScreen_Vertical,
                    narrow: layout.narrowStream ?? null,
                    largeAreaViewport1,
                    largeAreaViewport2,
                    sideAreaViewports,
                    overflowViewports,
                };
                break;
            }
        }

        result = result ?? {
            type: VisualLayoutType.BestFit_NoScreenshare,
            viewports: [],
            overflowViewports: viewports,
        };

        result.overflowViewports = R.sortWith(
            [(x, y) => (x.isSelf ? (y.isSelf ? 0 : -1) : y.isSelf ? 1 : 0), (x, y) => x.joinedAt - y.joinedAt],
            result.overflowViewports
        );

        return result;
    }, [layout, viewports, isRecordingMode]);

    return result;
}
