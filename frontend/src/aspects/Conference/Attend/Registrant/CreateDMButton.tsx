import type { ButtonProps } from "@chakra-ui/react";
import { Button, useToast } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useCreateDmMutation } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { useMaybeGlobalChatState } from "../../../Chat/GlobalChatStateProvider";
import { useConference } from "../../useConference";

export default function CreateDMButton({
    registrantId,
    onCreate,
    ...props
}: {
    registrantId: string;
    onCreate?: () => void;
} & ButtonProps): JSX.Element {
    const mChatState = useMaybeGlobalChatState();

    const conference = useConference();
    const [{ fetching: creatingDM }, createDmMutation] = useCreateDmMutation();
    const toast = useToast();
    const createDM = useCallback(
        async (ev: React.MouseEvent<HTMLButtonElement>) => {
            ev.stopPropagation();
            ev.preventDefault();

            if (mChatState?.openChatInSidebar) {
                try {
                    const result = await createDmMutation({
                        registrantIds: [registrantId],
                        conferenceId: conference.id,
                    });
                    if (result.error || !result.data?.createRoomDm) {
                        console.error("Failed to create DM", result.error);
                        throw new Error("Failed to create DM");
                    } else {
                        await new Promise((r) => setTimeout(r, 500));

                        if (result.data.createRoomDm.message !== "DM already exists") {
                            toast({
                                title: result.data.createRoomDm.message ?? "Created new DM",
                                status: "success",
                            });
                        }

                        mChatState.openChatInSidebar(result.data.createRoomDm.chatId);

                        onCreate?.();
                    }
                } catch (e) {
                    toast({
                        title: "Could not create DM",
                        status: "error",
                    });
                    console.error("Could not create DM", e);
                }
            }
        },
        [registrantId, mChatState, createDmMutation, conference.id, onCreate, toast]
    );

    return (
        <Button
            flex="0 0 auto"
            {...props}
            onClick={createDM}
            isLoading={creatingDM}
            colorScheme="PrimaryActionButton"
            size="sm"
        >
            <FAIcon icon="comment" iconStyle="s" mr={3} /> Chat
        </Button>
    );
}
