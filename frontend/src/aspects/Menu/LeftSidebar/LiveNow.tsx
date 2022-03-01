import { Button } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../Chakra/FAIcon";
import LiveProgramRooms from "../../Conference/Attend/Rooms/V2/LiveProgramRooms";
import { useLiveProgramRooms } from "../../Conference/Attend/Rooms/V2/useLiveProgramRooms";
import useIsNarrowView from "../../Hooks/useIsNarrowView";
import Pullout from "./Pullout";

export default function LiveNow({ isMenuExpanded }: { isMenuExpanded: boolean }): JSX.Element {
    const state = useLiveProgramRooms();
    const narrowView = useIsNarrowView();

    return (
        <Pullout
            isIn={state.isOpen}
            isMenuExpanded={isMenuExpanded}
            onClose={(ev) => {
                if (
                    (ev.target as HTMLElement).id !== "live-now-menu-button" &&
                    (ev.target as HTMLElement).offsetParent?.id !== "live-now-menu-button"
                ) {
                    state.onClose();
                }
            }}
        >
            {narrowView ? (
                <Button
                    aria-label="Close Live Now list"
                    leftIcon={<FAIcon iconStyle="s" icon="times" />}
                    colorScheme="LeftMenuButton"
                    variant="ghost"
                    onClick={state.onClose}
                    m="3px"
                    size="sm"
                    alignSelf="flex-end"
                >
                    Close
                </Button>
            ) : undefined}
            <LiveProgramRooms />
        </Pullout>
    );
}
