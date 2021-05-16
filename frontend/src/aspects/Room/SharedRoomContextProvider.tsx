import React, { useMemo } from "react";
import * as portals from "react-reverse-portal";
import { ChimeRoom } from "../Conference/Attend/Room/Chime/ChimeRoom";
import { VonageRoom } from "../Conference/Attend/Room/Vonage/VonageRoom";
import { SharedRoomContext } from "./useSharedRoomContext";

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
            <portals.InPortal node={vonageNode}>
                <VonageRoom
                    getAccessToken={async () => ""}
                    vonageSessionId=""
                    disable={true}
                    isBackstageRoom={false}
                    raiseHandPrejoinEventId={null}
                    isRaiseHandWaiting={undefined}
                    requireMicrophone={false}
                />
            </portals.InPortal>
            <portals.InPortal node={chimeNode}>
                <ChimeRoom disable={true} roomId="" />
            </portals.InPortal>
            <SharedRoomContext.Provider value={ctx}>{children}</SharedRoomContext.Provider>
        </>
    );
}
