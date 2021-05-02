// import { gql } from "@apollo/client";
// import {
//     Box,
//     Button,
//     Checkbox,
//     Modal,
//     ModalBody,
//     ModalCloseButton,
//     ModalContent,
//     ModalFooter,
//     ModalHeader,
//     ModalOverlay,
//     Spinner,
//     Text,
//     useToast,
//     VStack,
// } from "@chakra-ui/react";
// import { ElementPublishState, elementPublishState } from "@clowdr-app/shared-types/build/content";
// import * as R from "ramda";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useInsertPublishVideoJobsMutation, useSelectItemsQuery } from "../../../../generated/graphql";
// import { useConference } from "../../useConference";

// interface Props {
//     isOpen: boolean;
//     onOpen: () => void;
//     onClose: () => void;
//     itemIds: Set<string>;
// }

// gql`
//     query SelectItems($conferenceId: uuid!, $itemIds: [uuid!]!) {
//         Item(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $itemIds } }) {
//             elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_PREPUBLISH] } }) {
//                 id
//                 typeName
//                 data
//                 name
//             }
//             id
//             title
//         }
//     }

//     mutation InsertPublishVideoJobs($objects: [job_queues_PublishVideoJob_insert_input!]!) {
//         insert_job_queues_PublishVideoJob(objects: $objects) {
//             affected_rows
//             returning {
//                 id
//             }
//         }
//     }
// `;

// export default function PublishVideosModal({ isOpen, onClose, itemIds }: Props): JSX.Element {
//     const conference = useConference();
//     const { loading, error, data } = useSelectItemsQuery({
//         variables: {
//             conferenceId: conference.id,
//             itemIds: Array.from(itemIds),
//         },
//     });

//     const elements = useMemo(
//         () =>
//             R.flatten(
//                 data?.Item.map((group) =>
//                     group.elements.map((item) => ({
//                         id: `${item.id}`,
//                         publishState: elementPublishState(item.data),
//                         itemName: group.title,
//                         elementName: item.name,
//                     }))
//                 ) ?? []
//             ),
//         [data?.Item]
//     );

//     const defaultCheckedItemIds = useMemo(() => {
//         return elements
//             .filter(
//                 (item) =>
//                     item.publishState === ElementPublishState.AlreadyPublishedButPublishable ||
//                     item.publishState === ElementPublishState.Publishable
//             )
//             .map((item) => item.id);
//     }, [elements]);

//     useEffect(() => {
//         setCheckedItemIds(defaultCheckedItemIds);
//     }, [defaultCheckedItemIds]);

//     const [checkedItemIds, setCheckedItemIds] = useState<string[]>(defaultCheckedItemIds);
//     const [publishing, setPublishing] = useState<boolean>(false);
//     const toast = useToast();

//     const [insertPublishVideoJobs] = useInsertPublishVideoJobsMutation();

//     const publishVideos = useCallback(async () => {
//         await insertPublishVideoJobs({
//             variables: {
//                 objects: checkedItemIds.map((itemId) => ({ elementId: itemId, conferenceId: conference.id })),
//             },
//         });
//     }, [checkedItemIds, conference.id, insertPublishVideoJobs]);

//     function publishStateToLabel(status: ElementPublishState): string {
//         switch (status) {
//             case ElementPublishState.AlreadyPublishedAndUpToDate:
//                 return "already published and up to date";
//             case ElementPublishState.AlreadyPublishedButNotPublishable:
//                 return "previous version published - new version is still being processed";
//             case ElementPublishState.AlreadyPublishedButPublishable:
//                 return "can publish updated version";
//             case ElementPublishState.NotPublishable:
//                 return "cannot publish - video not yet uploaded or processed";
//             case ElementPublishState.Publishable:
//                 return "can publish";
//         }
//     }

//     return (
//         <>
//             <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
//                 <ModalOverlay />
//                 <ModalContent>
//                     <ModalHeader pb={0}>Publish Videos</ModalHeader>
//                     <ModalCloseButton />
//                     <ModalBody>
//                         <Box>
//                             <Text>Publish the following videos?</Text>
//                             {loading ? (
//                                 <Spinner />
//                             ) : error ? (
//                                 <>Could not load items</>
//                             ) : (
//                                 <VStack mt={5} alignItems="left" overflowY="auto" maxHeight="50vh">
//                                     {elements.map((item) => (
//                                         <Checkbox
//                                             key={item.id}
//                                             isChecked={checkedItemIds.includes(item.id)}
//                                             isDisabled={
//                                                 item.publishState !== ElementPublishState.Publishable &&
//                                                 item.publishState !==
//                                                     ElementPublishState.AlreadyPublishedButPublishable
//                                             }
//                                             onChange={(e) =>
//                                                 e.target.checked
//                                                     ? setCheckedItemIds(R.append(item.id, checkedItemIds))
//                                                     : setCheckedItemIds(R.without([item.id], checkedItemIds))
//                                             }
//                                         >
//                                             {item.itemName}: {item.elementName} (
//                                             {publishStateToLabel(item.publishState)})
//                                         </Checkbox>
//                                     ))}
//                                 </VStack>
//                             )}
//                         </Box>
//                     </ModalBody>
//                     <ModalFooter>
//                         <Button
//                             onClick={async () => {
//                                 try {
//                                     setPublishing(true);
//                                     await publishVideos();
//                                     toast({
//                                         description:
//                                             "Started publishing videos. They might take a few minutes to appear.",
//                                         status: "success",
//                                     });
//                                 } catch (e) {
//                                     console.error("Error while publishing videos", e);
//                                     toast({
//                                         description: "Failed to start publishing videos. Please try again later.",
//                                         status: "error",
//                                     });
//                                 } finally {
//                                     setPublishing(false);
//                                     onClose();
//                                 }
//                             }}
//                             isLoading={publishing}
//                             colorScheme="green"
//                             mt={5}
//                         >
//                             Publish
//                         </Button>
//                     </ModalFooter>
//                 </ModalContent>
//             </Modal>
//         </>
//     );
// }
