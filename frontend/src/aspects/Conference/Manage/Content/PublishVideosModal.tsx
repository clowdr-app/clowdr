import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Checkbox,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { ContentItemPublishState, contentItemPublishState } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useInsertPublishVideoJobsMutation, useSelectContentGroupsQuery } from "../../../../generated/graphql";
import { useConference } from "../../useConference";

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    contentGroupIds: Set<string>;
}

gql`
    query SelectContentGroups($conferenceId: uuid!, $contentGroupIds: [uuid!]!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $contentGroupIds } }) {
            contentItems(where: { contentTypeName: { _in: [VIDEO_BROADCAST, VIDEO_PREPUBLISH] } }) {
                id
                contentTypeName
                data
                name
            }
            id
            title
        }
    }

    mutation InsertPublishVideoJobs($objects: [job_queues_PublishVideoJob_insert_input!]!) {
        insert_job_queues_PublishVideoJob(objects: $objects) {
            affected_rows
            returning {
                id
            }
        }
    }
`;

export default function PublishVideosModal({ isOpen, onClose, contentGroupIds }: Props): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useSelectContentGroupsQuery({
        variables: {
            conferenceId: conference.id,
            contentGroupIds: Array.from(contentGroupIds),
        },
    });

    const contentItems = useMemo(
        () =>
            R.flatten(
                data?.ContentGroup.map((group) =>
                    group.contentItems.map((item) => ({
                        id: `${item.id}`,
                        publishState: contentItemPublishState(item.data),
                        contentGroupName: group.title,
                        contentItemName: item.name,
                    }))
                ) ?? []
            ),
        [data?.ContentGroup]
    );

    const defaultCheckedItemIds = useMemo(() => {
        return contentItems
            .filter(
                (item) =>
                    item.publishState === ContentItemPublishState.AlreadyPublishedButPublishable ||
                    item.publishState === ContentItemPublishState.Publishable
            )
            .map((item) => item.id);
    }, [contentItems]);

    useEffect(() => {
        setCheckedItemIds(defaultCheckedItemIds);
    }, [defaultCheckedItemIds]);

    const [checkedItemIds, setCheckedItemIds] = useState<string[]>(defaultCheckedItemIds);
    const [publishing, setPublishing] = useState<boolean>(false);
    const toast = useToast();

    const [insertPublishVideoJobs] = useInsertPublishVideoJobsMutation();

    const publishVideos = useCallback(async () => {
        await insertPublishVideoJobs({
            variables: {
                objects: checkedItemIds.map((itemId) => ({ contentItemId: itemId, conferenceId: conference.id })),
            },
        });
    }, [checkedItemIds, conference.id, insertPublishVideoJobs]);

    function publishStateToLabel(status: ContentItemPublishState): string {
        switch (status) {
            case ContentItemPublishState.AlreadyPublishedAndUpToDate:
                return "already published and up to date";
            case ContentItemPublishState.AlreadyPublishedButNotPublishable:
                return "previous version published - new version is still being processed";
            case ContentItemPublishState.AlreadyPublishedButPublishable:
                return "can publish updated version";
            case ContentItemPublishState.NotPublishable:
                return "cannot publish - video not yet uploaded or processed";
            case ContentItemPublishState.Publishable:
                return "can publish";
        }
    }

    return (
        <>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader pb={0}>Publish Videos</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <Text>Publish the following videos?</Text>
                            {loading ? (
                                <Spinner />
                            ) : error ? (
                                <>Could not load items</>
                            ) : (
                                <VStack mt={5} alignItems="left" overflowY="auto" maxHeight="50vh">
                                    {contentItems.map((item) => (
                                        <Checkbox
                                            key={item.id}
                                            isChecked={checkedItemIds.includes(item.id)}
                                            isDisabled={
                                                item.publishState !== ContentItemPublishState.Publishable &&
                                                item.publishState !==
                                                    ContentItemPublishState.AlreadyPublishedButPublishable
                                            }
                                            onChange={(e) =>
                                                e.target.checked
                                                    ? setCheckedItemIds(R.append(item.id, checkedItemIds))
                                                    : setCheckedItemIds(R.without([item.id], checkedItemIds))
                                            }
                                        >
                                            {item.contentGroupName}: {item.contentItemName} (
                                            {publishStateToLabel(item.publishState)})
                                        </Checkbox>
                                    ))}
                                </VStack>
                            )}
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={async () => {
                                try {
                                    setPublishing(true);
                                    await publishVideos();
                                    toast({
                                        description:
                                            "Started publishing videos. They might take a few minutes to appear.",
                                        status: "success",
                                    });
                                } catch (e) {
                                    console.error("Error while publishing videos", e);
                                    toast({
                                        description: "Failed to start publishing videos. Please try again later.",
                                        status: "error",
                                    });
                                } finally {
                                    setPublishing(false);
                                    onClose();
                                }
                            }}
                            isLoading={publishing}
                            colorScheme="green"
                            mt={5}
                        >
                            Publish
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
