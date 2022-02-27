import { Button, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { RoomMembersModal } from "./RoomMembersModal";

export function RoomMembersButton({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const listModal = useDisclosure();

    return (
        <>
            <Button aria-label="Members of this room" title="Members of this room" onClick={listModal.onOpen} size="sm">
                <FAIcon icon="users" iconStyle="s" mr={3} />
                <Text>Room details</Text>
            </Button>
            <RoomMembersModal isOpen={listModal.isOpen} onClose={listModal.onClose} roomDetails={roomDetails} />
        </>
    );
}
