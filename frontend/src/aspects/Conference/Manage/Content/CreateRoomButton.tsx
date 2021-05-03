import { Button, useToast } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import { useItem_CreateRoomMutation } from "../../../../generated/graphql";
import { useConference } from "../../useConference";

export function CreateRoomButton({
    groupId,
    buttonText = "Create discussion room",
}: {
    groupId: string | undefined;
    buttonText?: string;
}): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    const history = useHistory();
    const [createBreakoutMutation] = useItem_CreateRoomMutation();
    const [creatingBreakout, setCreatingBreakout] = useState<boolean>(false);
    const createBreakout = useCallback(async () => {
        if (!groupId) {
            return;
        }

        try {
            setCreatingBreakout(true);
            const { data } = await createBreakoutMutation({
                variables: {
                    conferenceId: conference.id,
                    itemId: groupId,
                },
            });

            if (!data?.createItemRoom || !data.createItemRoom.roomId) {
                throw new Error(`No data returned: ${data?.createItemRoom?.message}`);
            }

            const roomId = data.createItemRoom.roomId;

            // Wait so that breakout session has a chance to be created
            setTimeout(() => history.push(`/conference/${conference.slug}/room/${roomId}`), 2000);
        } catch (e) {
            toast({
                status: "error",
                title: "Failed to create room.",
                description: e?.message,
            });
            setCreatingBreakout(false);
        }
    }, [conference.id, conference.slug, createBreakoutMutation, groupId, history, toast]);

    return (
        <Button isLoading={creatingBreakout} onClick={createBreakout}>
            {buttonText}
        </Button>
    );
}
