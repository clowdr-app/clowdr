import React, { useMemo } from "react";
import * as portals from "react-reverse-portal";
import { VonageRoom } from "../Conference/Attend/Room/Vonage/VonageRoom";
import { SharedRoomContext } from "./useSharedRoomContext";

export function SharedRoomContextProvider({
    children,
}: {
    children: string | React.ReactNodeArray | React.ReactNode;
}): JSX.Element {
    const roomNode = useMemo(() => portals.createHtmlPortalNode(), []);

    return (
        <>
            <portals.InPortal node={roomNode}>
                <VonageRoom getAccessToken={async () => ""} vonageSessionId="" disable={false} />
            </portals.InPortal>
            <SharedRoomContext.Provider value={{ portalNode: roomNode }}>{children}</SharedRoomContext.Provider>
        </>
    );
}
