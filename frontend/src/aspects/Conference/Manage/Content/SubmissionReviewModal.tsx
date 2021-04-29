import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Grid,
    GridItem,
    Heading,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
    UnorderedList,
    VStack,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { ContentItem } from "../../Attend/Content/Item/ContentItem";
import type { ContentGroupDescriptor, ContentItemDescriptor } from "./Types";

export function SubmissionReviewModal({
    isOpen,
    onClose,
    contentGroups,
}: {
    isOpen: boolean;
    onClose: () => void;
    contentGroups: ContentGroupDescriptor[];
}): JSX.Element {
    const sortedGroups = useMemo(() => contentGroups.sort((x, y) => x.title.localeCompare(y.title)), [contentGroups]);

    const groupsWithItemsNoUploaders = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.requiredItems.some(
                    (y) =>
                        y.uploaders.length === 0 &&
                        !sortedGroups.some((g) => g.items.some((i) => i.requiredContentId === y.id))
                )
            ),
        [sortedGroups]
    );
    const groupsWithItemsNoSentRequests = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.requiredItems.some(
                    (y) =>
                        y.uploaders.length !== 0 &&
                        y.uploaders.every((z) => z.emailsSentCount === 0) &&
                        !sortedGroups.some((g) => g.items.some((i) => i.requiredContentId === y.id))
                )
            ),
        [sortedGroups]
    );
    const groupsWithSendRequestsNoSubmissions = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.requiredItems.some(
                    (y) =>
                        y.uploaders.length !== 0 &&
                        y.uploaders.some((z) => z.emailsSentCount !== 0) &&
                        !sortedGroups.some((g) => g.items.some((i) => i.requiredContentId === y.id))
                )
            ),
        [sortedGroups]
    );
    const groupsWithSubmissions = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.requiredItems.some((y) => sortedGroups.some((g) => g.items.some((i) => i.requiredContentId === y.id)))
            ),
        [sortedGroups]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Review submissions</ModalHeader>
                <ModalCloseButton />
                <ModalBody mb={4}>
                    <Accordion allowMultiple={false} allowToggle>
                        <AccordionItem>
                            <AccordionButton>
                                <AccordionIcon />
                                No uploaders
                            </AccordionButton>
                            <AccordionPanel>
                                <UnorderedList>
                                    {groupsWithItemsNoUploaders.map((x) => (
                                        <ListItem key={x.id}>
                                            <Text>{x.title}</Text>
                                            <UnorderedList>
                                                {x.requiredItems
                                                    .filter(
                                                        (y) =>
                                                            y.uploaders.length === 0 &&
                                                            !sortedGroups.some((g) =>
                                                                g.items.some((i) => i.requiredContentId === y.id)
                                                            )
                                                    )
                                                    .map((y) => (
                                                        <ListItem key={y.id}>
                                                            {y.name} ({y.typeName})
                                                        </ListItem>
                                                    ))}
                                            </UnorderedList>
                                        </ListItem>
                                    ))}
                                    {groupsWithItemsNoUploaders.length === 0 ? <ListItem>None</ListItem> : undefined}
                                </UnorderedList>
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>
                                <AccordionIcon />
                                Submissions not yet requested
                            </AccordionButton>
                            <AccordionPanel>
                                <UnorderedList>
                                    {groupsWithItemsNoSentRequests.map((x) => (
                                        <ListItem key={x.id}>
                                            <Text>{x.title}</Text>
                                            <UnorderedList>
                                                {x.requiredItems
                                                    .filter(
                                                        (y) =>
                                                            y.uploaders.length !== 0 &&
                                                            y.uploaders.every((z) => z.emailsSentCount === 0) &&
                                                            !sortedGroups.some((g) =>
                                                                g.items.some((i) => i.requiredContentId === y.id)
                                                            )
                                                    )
                                                    .map((y) => (
                                                        <ListItem key={y.id}>
                                                            {y.name} ({y.typeName})
                                                        </ListItem>
                                                    ))}
                                            </UnorderedList>
                                        </ListItem>
                                    ))}
                                    {groupsWithItemsNoSentRequests.length === 0 ? <ListItem>None</ListItem> : undefined}
                                </UnorderedList>
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>
                                <AccordionIcon />
                                Awaiting submission
                            </AccordionButton>
                            <AccordionPanel>
                                <UnorderedList>
                                    {groupsWithSendRequestsNoSubmissions.map((x) => (
                                        <ListItem key={x.id}>
                                            <Text>{x.title}</Text>
                                            <UnorderedList>
                                                {x.requiredItems
                                                    .filter(
                                                        (y) =>
                                                            y.uploaders.length !== 0 &&
                                                            y.uploaders.some((z) => z.emailsSentCount !== 0) &&
                                                            !sortedGroups.some((g) =>
                                                                g.items.some((i) => i.requiredContentId === y.id)
                                                            )
                                                    )
                                                    .map((y) => (
                                                        <ListItem key={y.id}>
                                                            {y.name} ({y.typeName})
                                                        </ListItem>
                                                    ))}
                                            </UnorderedList>
                                        </ListItem>
                                    ))}
                                    {groupsWithSendRequestsNoSubmissions.length === 0 ? (
                                        <ListItem>None</ListItem>
                                    ) : undefined}
                                </UnorderedList>
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>
                                <AccordionIcon />
                                Submission received
                            </AccordionButton>
                            <AccordionPanel>
                                <Grid
                                    templateColumns={[
                                        "repeat(1, 1fr)",
                                        "repeat(2, 1fr)",
                                        "repeat(2, 1fr)",
                                        "repeat(3, 1fr)",
                                    ]}
                                    w="100%"
                                    gap={2}
                                >
                                    {groupsWithSubmissions.reduce(
                                        (accOuter, x) => [
                                            ...accOuter,
                                            ...x.requiredItems.reduce((acc, y) => {
                                                const item = sortedGroups.reduce<ContentItemDescriptor | undefined>(
                                                    (acc, g) =>
                                                        acc ?? g.items.find((i) => i.requiredContentId === y.id),
                                                    undefined
                                                );
                                                if (item) {
                                                    return [
                                                        ...acc,
                                                        <GridItem key={y.id} maxW="500px" border="1px solid black">
                                                            <VStack>
                                                                <Heading as="h3" fontSize="md" p={1}>
                                                                    {x.title}
                                                                </Heading>
                                                                <Heading
                                                                    as="h4"
                                                                    fontSize="sm"
                                                                    fontWeight="normal"
                                                                    p={1}
                                                                >
                                                                    {y.name} ({y.typeName})
                                                                </Heading>
                                                                <ContentItem
                                                                    item={{
                                                                        ...item,
                                                                        contentTypeName: item.typeName,
                                                                    }}
                                                                />
                                                            </VStack>
                                                        </GridItem>,
                                                    ];
                                                }
                                                return acc;
                                            }, [] as JSX.Element[]),
                                        ],
                                        [] as JSX.Element[]
                                    )}
                                    {groupsWithSubmissions.length === 0 ? <GridItem>None</GridItem> : undefined}
                                </Grid>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
