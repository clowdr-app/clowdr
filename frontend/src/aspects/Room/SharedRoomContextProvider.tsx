import React, { Suspense, useMemo } from "react";
import * as portals from "react-reverse-portal";
import { SharedRoomContext } from "./useSharedRoomContext";

const PermissionInstructionsModal = React.lazy(() => import("./PermissionInstructionsModal"));
const ChimeRoom = React.lazy(() =>
    import("../Conference/Attend/Room/Chime/ChimeRoom").then((x) => ({ default: x.ChimeRoom }))
);
const VonageRoom = React.lazy(() =>
    import("../Conference/Attend/Room/Vonage/VonageRoom").then((x) => ({ default: x.VonageRoom }))
);

export function SharedRoomContextProvider({
    children,
}: {
    children: string | React.ReactNodeArray | React.ReactNode;
}): JSX.Element {
    const vonageNode = useMemo(() => portals.createHtmlPortalNode(), []);
    const chimeNode = useMemo(() => portals.createHtmlPortalNode(), []);

    const ctx = useMemo(() => ({ vonagePortalNode: vonageNode, chimePortalNode: chimeNode }), [vonageNode, chimeNode]);

    return (
        <>
            <Suspense fallback={<></>}>
                <portals.InPortal node={vonageNode}>
                    <VonageRoom
                        getAccessToken={async () => ""}
                        roomId={null}
                        eventId={null}
                        vonageSessionId=""
                        disable={true}
                        isBackstageRoom={false}
                        raiseHandPrejoinEventId={null}
                        isRaiseHandWaiting={undefined}
                        requireMicrophoneOrCamera={false}
                        completeJoinRef={undefined}
                        canControlRecording={false}
                        layout={undefined}
                    />
                </portals.InPortal>
            </Suspense>
            <Suspense fallback={<></>}>
                <portals.InPortal node={chimeNode}>
                    <ChimeRoom disable={true} roomId="" />
                </portals.InPortal>
            </Suspense>
            <SharedRoomContext.Provider value={ctx}>
                {children}
                <Suspense fallback={null}>
                    <PermissionInstructionsModal />
                </Suspense>
            </SharedRoomContext.Provider>
        </>
    );
}
