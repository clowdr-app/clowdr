import { Button, ButtonProps, useToast } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import { gql } from "urql";
import { useItem_CreateRoomMutation } from "../../../../../../generated/graphql";
import { useConference } from "../../../../useConference";

gql`
    mutation Item_CreateRoom($conferenceId: uuid!, $itemId: uuid!) {
        createItemRoom(conferenceId: $conferenceId, itemId: $itemId) {
            roomId
            message
        }
    }
`;

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
    const [createVideoChatMutation] = useItem_CreateRoomMutation();
    const [creatingVideoChat, setCreatingVideoChat] = useState<boolean>(false);
    const createVideoChat = useCallback(async () => {
        if (!groupId) {
            return;
        }

        try {
            setCreatingVideoChat(true);
            const { data } = await createVideoChatMutation({
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
            setCreatingVideoChat(false);
        }
    }, [conference.id, createVideoChatMutation, groupId, refetch, toast]);

    return (
        <Button isLoading={creatingVideoChat} onClick={createVideoChat} {...props}>
            {buttonText}
        </Button>
    );
}
