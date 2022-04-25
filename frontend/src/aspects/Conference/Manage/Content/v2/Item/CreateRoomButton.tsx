import type { ButtonProps } from "@chakra-ui/react";
import { Button, useToast } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useState } from "react";
import { useItem_CreateRoomMutation } from "../../../../../../generated/graphql";
import { useAuthParameters } from "../../../../../GQL/AuthParameters";
import { useConference } from "../../../../useConference";

gql`
    mutation Item_CreateRoom($conferenceId: uuid!, $subconferenceId: uuid, $itemId: uuid!) {
        createItemRoom(conferenceId: $conferenceId, subconferenceId: $subconferenceId, itemId: $itemId) {
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
    const { subconferenceId } = useAuthParameters();

    const toast = useToast();
    const [, createVideoChatMutation] = useItem_CreateRoomMutation();
    const [creatingVideoChat, setCreatingVideoChat] = useState<boolean>(false);
    const createVideoChat = useCallback(async () => {
        if (!groupId) {
            return;
        }

        try {
            setCreatingVideoChat(true);
            const { data } = await createVideoChatMutation(
                {
                    conferenceId: conference.id,
                    subconferenceId,
                    itemId: groupId,
                },
                {
                    fetchOptions: {
                        headers: {
                            [AuthHeader.Role]: subconferenceId
                                ? HasuraRoleName.SubconferenceOrganizer
                                : HasuraRoleName.ConferenceOrganizer,
                        },
                    },
                }
            );

            if (!data?.createItemRoom || !data.createItemRoom.roomId) {
                throw new Error(`No data returned: ${data?.createItemRoom?.message}`);
            }

            refetch?.();
        } catch (e: any) {
            toast({
                status: "error",
                title: "Failed to create room.",
                description: e?.message,
            });
        } finally {
            setCreatingVideoChat(false);
        }
    }, [conference.id, createVideoChatMutation, groupId, refetch, subconferenceId, toast]);

    return (
        <Button isLoading={creatingVideoChat} onClick={createVideoChat} {...props}>
            {buttonText}
        </Button>
    );
}
