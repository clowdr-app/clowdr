import React, { Suspense, useMemo } from "react";
import * as portals from "react-reverse-portal";

const PermissionInstructionsModal = React.lazy(() => import("./PermissionInstructionsModal"));
const ChimeRoom = React.lazy(() =>
    import("../Conference/Attend/Room/Chime/ChimeRoom").then((x) => ({ default: x.ChimeRoom }))
);
const VonageRoom = React.lazy(() =>
    import("../Conference/Attend/Room/Vonage/VonageRoom").then((x) => ({ default: x.VonageRoom }))
);

function useValue() {
    const vonageNode = useMemo(
        () =>
            portals.createHtmlPortalNode<typeof VonageRoom>({
                attributes: {
                    style: "height: 100%;",
                },
            }),
        []
    );
    const chimeNode = useMemo(() => portals.createHtmlPortalNode<typeof ChimeRoom>(), []);

    const ctx = useMemo(() => ({ vonagePortalNode: vonageNode, chimePortalNode: chimeNode }), [vonageNode, chimeNode]);

    return ctx;
}

export const SharedRoomContext = React.createContext({} as unknown as ReturnType<typeof useValue>);

export function SharedRoomContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const ctx = useValue();
    return (
        <>
            <Suspense fallback={<></>}>
                <portals.InPortal node={ctx.vonagePortalNode}>
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
                        completeGetAccessToken={undefined}
                        canControlRecordingAs={[]}
                        layout={undefined}
                    />
                </portals.InPortal>
            </Suspense>
            <Suspense fallback={<></>}>
                <portals.InPortal node={ctx.chimePortalNode}>
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
