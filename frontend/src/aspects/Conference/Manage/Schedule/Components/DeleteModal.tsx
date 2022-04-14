import {
    Alert,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    ManageSchedule_DeleteContentMutation,
    ManageSchedule_DeleteContentMutationVariables,
    ManageSchedule_DeleteEventsMutation,
    ManageSchedule_DeleteEventsMutationVariables,
    ManageSchedule_GetContentIdsQuery,
    ManageSchedule_GetContentIdsQueryVariables,
} from "../../../../../generated/graphql";
import {
    ManageSchedule_DeleteContentDocument,
    ManageSchedule_DeleteEventsDocument,
    ManageSchedule_GetContentIdsDocument,
} from "../../../../../generated/graphql";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import extractActualError from "../../../../GQL/ExtractActualError";
import { makeContext } from "../../../../GQL/make-context";
import { useRealTime } from "../../../../Hooks/useRealTime";

gql`
    mutation ManageSchedule_DeleteEvents($ids: [uuid!]!) {
        delete_schedule_Event(where: { id: { _in: $ids } }) {
            affected_rows
        }
    }

    mutation ManageSchedule_DeleteContent($itemIds: [uuid!]!) {
        delete_content_Item(where: { id: { _in: $itemIds } }) {
            affected_rows
        }
    }

    query ManageSchedule_GetContentIds($eventIds: [uuid!]!) {
        schedule_Event(where: { id: { _in: $eventIds } }) {
            id

            itemId
            presentations {
                id
                itemId
            }
        }
    }
`;

export default function DeleteModal(props: {
    isOpen: boolean;
    onClose: (shouldRefetch: boolean) => void;
    deleteEventIds: string[];
    deleteEventType: "session" | "presentation";
}): JSX.Element {
    if (props.isOpen) {
        return <DeleteModalInner {...props} />;
    }
    return <></>;
}

function DeleteModalInner({
    isOpen,
    onClose,
    deleteEventIds,
    deleteEventType,
}: {
    isOpen: boolean;
    onClose: (didDelete: boolean) => void;
    deleteEventIds: string[];
    deleteEventType: "session" | "presentation";
}): JSX.Element {
    const toast = useToast();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const client = useClient();

    const deleteSessionsLeastDestructiveActionRef = useRef<HTMLButtonElement | null>(null);

    const [startDeleteContentAt, setStartDeleteContentAt] = useState<number | null>(null);
    const [startDeleteEventsAt, setStartDeleteEventsAt] = useState<number | null>(null);
    const timeoutSeconds = 10;
    const now = useRealTime(1000);

    const [deletingContent, setDeletingContent] = useState<boolean>(false);
    const [deletingEvents, setDeletingEvents] = useState<boolean>(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (startDeleteContentAt !== null) {
            if (now - startDeleteContentAt > timeoutSeconds * 1000) {
                setDeletingContent(true);
            }
        } else if (startDeleteEventsAt !== null) {
            if (now - startDeleteEventsAt > timeoutSeconds * 1000) {
                setDeletingEvents(true);
            }
        }
    }, [now, startDeleteContentAt, startDeleteEventsAt]);

    useEffect(() => {
        if (deletingContent) {
            (async () => {
                try {
                    const idsResponse = await client
                        .query<ManageSchedule_GetContentIdsQuery, ManageSchedule_GetContentIdsQueryVariables>(
                            ManageSchedule_GetContentIdsDocument,
                            {
                                eventIds: deleteEventIds,
                            },
                            context
                        )
                        .toPromise();

                    if (idsResponse.error) {
                        throw extractActualError(idsResponse.error) ?? "Unknown error fetching content ids.";
                    }

                    const itemIds = (idsResponse.data?.schedule_Event
                        .flatMap((x) => [x.itemId, ...x.presentations.map((y) => y.itemId)])
                        .filter((x) => !!x) ?? []) as string[];

                    const response2 = await client
                        .mutation<ManageSchedule_DeleteEventsMutation, ManageSchedule_DeleteEventsMutationVariables>(
                            ManageSchedule_DeleteEventsDocument,
                            {
                                ids: deleteEventIds,
                            },
                            context
                        )
                        .toPromise();

                    if (response2.error) {
                        throw extractActualError(response2.error) ?? "Unknown error deleting events.";
                    }

                    const response = await client
                        .mutation<ManageSchedule_DeleteContentMutation, ManageSchedule_DeleteContentMutationVariables>(
                            ManageSchedule_DeleteContentDocument,
                            {
                                itemIds,
                            },
                            context
                        )
                        .toPromise();

                    if (response.error) {
                        throw extractActualError(response.error) ?? "Unknown error deleting events.";
                    }

                    setError(null);
                    onClose(true);
                } catch (e: any) {
                    setError(typeof e === "string" ? e : e.message ?? e.toString());
                } finally {
                    setDeletingContent(false);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deletingContent]);

    useEffect(() => {
        if (deletingEvents) {
            (async () => {
                try {
                    const response = await client
                        .mutation<ManageSchedule_DeleteEventsMutation, ManageSchedule_DeleteEventsMutationVariables>(
                            ManageSchedule_DeleteEventsDocument,
                            {
                                ids: deleteEventIds,
                            },
                            context
                        )
                        .toPromise();

                    if (response.error) {
                        throw extractActualError(response.error) ?? "Unknown error deleting events.";
                    }

                    setError(null);
                    onClose(true);
                } catch (e: any) {
                    setError(typeof e === "string" ? e : e.message ?? e.toString());
                } finally {
                    setDeletingContent(false);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deletingEvents]);

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={() => onClose(false)}
            leastDestructiveRef={deleteSessionsLeastDestructiveActionRef}
            size="2xl"
        >
            <AlertDialogOverlay />
            <AlertDialogContent>
                <AlertDialogHeader>
                    Delete {deleteEventIds.length} {deleteEventType}
                    {deleteEventIds.length !== 1 ? "s" : ""}?
                </AlertDialogHeader>
                <AlertDialogCloseButton />
                <AlertDialogBody>
                    This cannot be undone. {deleteEventIds.length} event{deleteEventIds.length === 1 ? "" : "s"} will be
                    deleted.
                </AlertDialogBody>
                <AlertDialogFooter>
                    <VStack w="100%" alignItems="flex-end">
                        {error !== null ? (
                            <Alert>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : undefined}
                        <Button
                            ref={deleteSessionsLeastDestructiveActionRef}
                            colorScheme="blue"
                            variant={
                                startDeleteContentAt !== null || startDeleteEventsAt !== null ? "solid" : "outline"
                            }
                            onClick={() => {
                                if (startDeleteContentAt !== null || startDeleteEventsAt !== null) {
                                    toast({
                                        status: "info",
                                        title: "Delete canceled",
                                        isClosable: true,
                                        duration: 5000,
                                        position: "top",
                                    });
                                    setDeletingContent(false);
                                    setDeletingEvents(false);
                                }
                                onClose(false);
                            }}
                            isDisabled={deletingContent || deletingEvents}
                        >
                            {deletingContent || deletingEvents
                                ? `Deleting... (${Math.floor(
                                      Math.abs(
                                          timeoutSeconds -
                                              (now - (startDeleteContentAt ?? startDeleteEventsAt ?? 0)) / 1000
                                      )
                                  )})`
                                : startDeleteContentAt !== null || startDeleteEventsAt !== null
                                ? `Made a mistake? Click to cancel (${Math.floor(
                                      Math.abs(
                                          timeoutSeconds -
                                              (now - (startDeleteContentAt ?? startDeleteEventsAt ?? 0)) / 1000
                                      )
                                  )})`
                                : "Cancel"}
                        </Button>
                        <Button
                            colorScheme="DestructiveActionButton"
                            variant="outline"
                            onClick={() => {
                                setStartDeleteContentAt(Date.now());
                            }}
                            isLoading={deletingContent}
                            isDisabled={
                                deletingContent || startDeleteContentAt !== null || startDeleteEventsAt !== null
                            }
                        >
                            Delete {deleteEventType === "session" ? "sessions and presentations, " : "presentations, "}
                            including content
                        </Button>
                        <Button
                            colorScheme="DestructiveActionButton"
                            variant="solid"
                            onClick={() => {
                                setStartDeleteEventsAt(Date.now());
                            }}
                            isLoading={deletingEvents}
                            isDisabled={
                                deletingContent || startDeleteContentAt !== null || startDeleteEventsAt !== null
                            }
                        >
                            Delete {deleteEventType === "session" ? "sessions and presentations " : "presentations "}{" "}
                            only
                        </Button>
                    </VStack>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
