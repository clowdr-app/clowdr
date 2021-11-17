import {
    Button,
    ButtonGroup,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    UnorderedList,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { CombineVideosJobDataBlob, InputElement } from "@midspace/shared-types/combineVideosJob";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { ElementBaseType, isElementDataBlob } from "@midspace/shared-types/content";
import * as R from "ramda";
import React, { useCallback, useMemo } from "react";
import { gql } from "urql";
import {
    useCombineVideosModal_CreateCombineVideosJobMutation,
    useCombineVideosModal_GetCombineVideosJobQuery,
    useCombineVideosModal_GetElementsQuery,
} from "../../../../../../generated/graphql";
import { makeContext } from "../../../../../GQL/make-context";
import useCurrentUser from "../../../../../Users/CurrentUser/useCurrentUser";
import { useConference } from "../../../../useConference";

export function CombineVideosModal({
    isOpen,
    onClose,
    elementsByItem,
}: {
    isOpen: boolean;
    onClose: () => void;
    elementsByItem: {
        itemId: string;
        elementIds: string[];
    }[];
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Combine videos</ModalHeader>
                <ModalCloseButton />
                {isOpen ? <ModalInner elementsByItem={elementsByItem} onClose={onClose} /> : undefined}
            </ModalContent>
        </Modal>
    );
}

gql`
    mutation CombineVideosModal_CreateCombineVideosJob(
        $conferenceId: uuid!
        $createdByRegistrantId: uuid!
        $outputName: String!
        $data: jsonb!
    ) {
        insert_job_queues_CombineVideosJob_one(
            object: {
                conferenceId: $conferenceId
                createdByRegistrantId: $createdByRegistrantId
                outputName: $outputName
                data: $data
            }
        ) {
            id
        }
    }

    query CombineVideosModal_GetCombineVideosJob($conferenceId: uuid!) {
        job_queues_CombineVideosJob(
            where: { conferenceId: { _eq: $conferenceId }, jobStatusName: { _in: [NEW, IN_PROGRESS] } }
        ) {
            id
            message
            jobStatusName
            data
            conferenceId
        }
    }

    query CombineVideosModal_GetElements($itemIds: [uuid!]!, $elementIds: [uuid!]!) {
        content_Item(where: { id: { _in: $itemIds } }) {
            id
            title
        }
        content_Element(where: { id: { _in: $elementIds } }) {
            id
            createdAt
            itemId
            data
            name
        }
    }
`;

function ModalInner({
    onClose,
    elementsByItem,
}: {
    onClose: () => void;
    elementsByItem: {
        itemId: string;
        elementIds: string[];
    }[];
}): JSX.Element {
    const elementIds_Flat = useMemo(() => R.flatten(elementsByItem.map((x) => x.elementIds)), [elementsByItem]);
    const itemIds = useMemo(() => elementsByItem.map((x) => x.itemId), [elementsByItem]);

    const conference = useConference();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
            }),
        []
    );
    const [combineVideosResponse] = useCombineVideosModal_GetCombineVideosJobQuery({
        variables: {
            conferenceId: conference.id,
        },
        requestPolicy: "network-only",
        context,
    });

    const [elementsResponse] = useCombineVideosModal_GetElementsQuery({
        variables: {
            itemIds,
            elementIds: elementIds_Flat,
        },
        requestPolicy: "network-only",
        context,
    });

    const alreadyBeingCombined = useMemo(() => {
        if (combineVideosResponse.data?.job_queues_CombineVideosJob) {
            return R.flatten(
                combineVideosResponse.data.job_queues_CombineVideosJob.map((x) => {
                    const data: CombineVideosJobDataBlob = x.data;
                    return data.inputElements.map((x) => x.elementId);
                })
            );
        }
        return null;
    }, [combineVideosResponse.data?.job_queues_CombineVideosJob]);

    const returnedElementsByItem = useMemo(
        () =>
            elementsResponse.data
                ? Object.entries(R.groupBy((x) => x.itemId, elementsResponse.data.content_Element))
                      .map(([itemId, elements]) => {
                          const filteredElements = elements.filter((el) => {
                              if (alreadyBeingCombined?.includes(el.id)) {
                                  return false;
                              }

                              if (isElementDataBlob(el.data)) {
                                  const db: ElementDataBlob = el.data;
                                  const latestVersion = R.last(db);
                                  if (latestVersion?.data.baseType === ElementBaseType.Video) {
                                      if (latestVersion.data.broadcastTranscode) {
                                          return !!latestVersion.data.broadcastTranscode.s3Url;
                                      } else if (latestVersion.data.transcode) {
                                          return !!latestVersion.data.transcode.s3Url;
                                      } else if (latestVersion.data.s3Url) {
                                          return true;
                                      }
                                  }
                              }
                              return false;
                          });
                          return {
                              item: elementsResponse.data?.content_Item.find((x) => x.id === itemId),
                              elements: filteredElements.sort(
                                  (x, y) => Date.parse(x.createdAt) - Date.parse(y.createdAt)
                              ),
                          };
                      })
                      .filter(({ item, elements }) => {
                          return item && elements.length > 1;
                      })
                : null,
        [elementsResponse.data, alreadyBeingCombined]
    );

    const user = useCurrentUser().user;
    const toast = useToast();

    const [, mutate] = useCombineVideosModal_CreateCombineVideosJobMutation();

    const onCombine = useCallback(async () => {
        if (returnedElementsByItem) {
            try {
                for (const { elements } of returnedElementsByItem) {
                    const parts: InputElement[] = elements.map((el) => ({
                        elementId: el.id,
                        includeSubtitles: false,
                    }));
                    const data: CombineVideosJobDataBlob = {
                        inputElements: parts,
                    };
                    const result = await mutate(
                        {
                            conferenceId: conference.id,
                            createdByRegistrantId: user.registrants[0].id,
                            outputName: "Combined video",
                            data,
                        },
                        {
                            fetchOptions: {
                                headers: {
                                    [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
                                },
                            },
                        }
                    );

                    if (!result.data?.insert_job_queues_CombineVideosJob_one) {
                        throw new Error("Failed to create CombineVideosJob");
                    }
                }
            } catch (e: any) {
                console.error("Failed to submit CombineVideosJob", e);
                toast({
                    status: "error",
                    title: "Failed to submit job",
                    description: e.message,
                });
            }
            onClose();
        }
    }, [returnedElementsByItem, onClose, mutate, conference.id, user.registrants, toast]);

    return (
        <>
            <ModalBody>
                <VStack spacing={4}>
                    {(elementsResponse.fetching && !elementsResponse.data) ||
                    (combineVideosResponse.fetching && !combineVideosResponse.data) ? (
                        <Spinner label="Loading element information" />
                    ) : undefined}
                    {alreadyBeingCombined && alreadyBeingCombined.length > 0 ? (
                        <Text w="100%">
                            Some elements have been excluded as they are part of ongoing jobs. It can take several hours
                            to process videos - please check individual items later for the final results.
                        </Text>
                    ) : undefined}
                    {returnedElementsByItem ? (
                        <>
                            <Text fontWeight="bold" w="100%">
                                {returnedElementsByItem.length} items containing elements to be combined
                            </Text>
                            <UnorderedList spacing={2} pl={4} w="100%">
                                {returnedElementsByItem.map(({ item, elements }) =>
                                    item ? (
                                        <ListItem key={item.id}>
                                            <Text fontWeight="bold">{item.title}</Text>
                                            <Text>{elements.length} videos to be combined</Text>
                                            <Text>
                                                {R.intersperse(
                                                    " followed by ",
                                                    elements.map((x) => x.name)
                                                ).reduce((acc, x) => acc + x, "")}
                                            </Text>
                                        </ListItem>
                                    ) : undefined
                                )}
                            </UnorderedList>
                        </>
                    ) : undefined}
                </VStack>
            </ModalBody>
            <ModalFooter>
                <ButtonGroup>
                    <Button mr={3} onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        mr={3}
                        onClick={onCombine}
                        colorScheme="purple"
                        isDisabled={!returnedElementsByItem || returnedElementsByItem.length === 0}
                    >
                        Combine
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    );
}
