import { gql } from "@apollo/client";
import {
    Box,
    Button,
    List,
    ListIcon,
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
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useSelectContentGroupsQuery } from "../../../../generated/graphql";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { ContentItemPublishState, contentItemPublishState } from "./contentPublishing";

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
`;

function VideoIcon() {
    return <FAIcon icon="video" iconStyle="s" w={6} h={6} />;
}

export default function PublishVideosModal({ isOpen, onClose, contentGroupIds }: Props): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useSelectContentGroupsQuery({
        variables: {
            conferenceId: conference.id,
            contentGroupIds: Array.from(contentGroupIds),
        },
    });

    const contentItemStatusMap = useMemo(
        () =>
            R.mergeAll(
                R.flatten(
                    data?.ContentGroup.map((contentGroup) =>
                        contentGroup.contentItems.map((item): { [key: string]: ContentItemPublishState } => ({
                            [`${item.id}`]: contentItemPublishState(item.data),
                        }))
                    ) ?? []
                )
            ),
        [data?.ContentGroup]
    );

    function publishStateToLabel(status: ContentItemPublishState): string {
        switch (status) {
            case ContentItemPublishState.AlreadyPublished:
                return "already published, will not republish";
            case ContentItemPublishState.NotPublishable:
                return "cannot publish - video not yet uploaded or processed";
            case ContentItemPublishState.Publishable:
                return "publishable";
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
                                <UnorderedList mt={5}>
                                    {data?.ContentGroup.map((contentGroup) => {
                                        return (
                                            <ListItem key={contentGroup.id}>
                                                {contentGroup.title}
                                                <List>
                                                    {contentGroup.contentItems.map((item) => {
                                                        return (
                                                            <ListItem key={item.id}>
                                                                <ListIcon as={VideoIcon} />
                                                                {item.name} (
                                                                {publishStateToLabel(contentItemStatusMap[item.id])})
                                                            </ListItem>
                                                        );
                                                    })}
                                                </List>
                                            </ListItem>
                                        );
                                    })}
                                </UnorderedList>
                            )}
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={() => {
                                //todo
                            }}
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
