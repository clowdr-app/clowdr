import { Button, ButtonProps, useToast } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import { useItem_CreateRoomMutation } from "../../../../generated/graphql";
import { useConference } from "../../useConference";

export function CreateRoomButton({
    itemId: groupId,
    buttonText = "Create discussion room",
    refetch,
    ...props
}: {
    itemId: string | undefined;
    buttonText?: string;
    refetch?: () => void;
} & ButtonProps): JSX.Element {
    const conference = useConference();
    const toast = useToast();
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

            refetch?.();
        } catch (e) {
            toast({
                status: "error",
                title: "Failed to create room.",
                description: e?.message,
            });
            setCreatingBreakout(false);
        }
    }, [conference.id, createBreakoutMutation, groupId, refetch, toast]);

    return (
        <Button isLoading={creatingBreakout} onClick={createBreakout} {...props}>
            {buttonText}
        </Button>
    );
}
