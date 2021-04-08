import React from "react";
import type { HtmlPortalNode } from "react-reverse-portal";
import type { VonageRoom } from "../Conference/Attend/Room/Vonage/VonageRoom";

export type SharedRoomContextInfo =
    | {
          vonagePortalNode: HtmlPortalNode<typeof VonageRoom>;
          chimePortalNode: HtmlPortalNode<typeof ChimeRoom>;
      }
    | undefined;

export const SharedRoomContext = React.createContext<SharedRoomContextInfo>(undefined);

export function useSharedRoomContext(): SharedRoomContextInfo {
    return React.useContext(SharedRoomContext);
}
