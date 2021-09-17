import { gql } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
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
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import {
    SubmissionsReviewModal_ElementFragment,
    useSubmissionsReviewModalDataQuery,
} from "../../../../../../generated/graphql";
import { Element } from "../../../../Attend/Content/Element/Element";

gql`
    query SubmissionsReviewModalData($itemIds: [uuid!]!) {
        content_Item(where: { id: { _in: $itemIds } }) {
            ...SubmissionsReviewModal_Item
        }
    }

    fragment SubmissionsReviewModal_Item on content_Item {
        id
        title
        hasUnsubmittedElements
        itemPeople {
            id
            person: personWithAccessToken {
                id
                name
                submissionRequestsSentCount
            }
        }
        elements {
            ...SubmissionsReviewModal_Element
        }
    }

    fragment SubmissionsReviewModal_Element on content_Element {
        id
        typeName
        name
        data
    }
`;

export function SubmissionsReviewModal({
    isOpen,
    onClose,
    itemIds,
}: {
    isOpen: boolean;
    onClose: () => void;
    itemIds: string[];
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full">
            <ModalOverlay />
            {isOpen ? <SubmissionsReviewModalLazyInner itemIds={itemIds} /> : undefined}
        </Modal>
    );
}

function SubmissionsReviewModalLazyInner({ itemIds }: { itemIds: string[] }): JSX.Element {
    const itemsResponse = useSubmissionsReviewModalDataQuery({
        variables: {
            itemIds,
        },
        fetchPolicy: "no-cache",
    });
    const sortedItems = useMemo(
        () => (itemsResponse.data?.content_Item ? R.sortBy((x) => x.title, itemsResponse.data.content_Item) : []),
        [itemsResponse.data?.content_Item]
    );

    const itemsNoPeople = useMemo(
        () => sortedItems.filter((x) => x.itemPeople.length === 0 && x.hasUnsubmittedElements),
        [sortedItems]
    );
    const itemsWithPeopleNotSentRequests = useMemo(
        () =>
            sortedItems.filter(
                (x) =>
                    x.itemPeople.length !== 0 &&
                    x.itemPeople.some((z) => !z.person?.submissionRequestsSentCount) &&
                    x.hasUnsubmittedElements
            ),
        [sortedItems]
    );
    const itemsWithSendRequestsMissingSubmissions = useMemo(
        () =>
            sortedItems.filter(
                (x) =>
                    x.itemPeople.length !== 0 &&
                    x.itemPeople.some((z) => z.person?.submissionRequestsSentCount) &&
                    x.hasUnsubmittedElements
            ),
        [sortedItems]
    );
    const itemsWithSubmissions = useMemo(
        () => sortedItems.filter((x) => !!x.elements.some((y) => y.data?.length)),
        [sortedItems]
    );

    return (
        <ModalContent m={0}>
            <ModalHeader>Review submissions</ModalHeader>
            <ModalCloseButton />
            <ModalBody mb={4}>
                <Accordion allowMultiple={false} allowToggle>
                    <AccordionItem>
                        <AccordionButton>
                            <AccordionIcon />
                            No people
                        </AccordionButton>
                        <AccordionPanel>
                            <UnorderedList>
                                {itemsNoPeople.map((x) => (
                                    <ListItem key={x.id}>
                                        <Text>{x.title}</Text>
                                        <UnorderedList>
                                            {x.elements
                                                .filter((y) => !y.data?.length)
                                                .map((y) => (
                                                    <ListItem key={y.id}>
                                                        {y.name} ({y.typeName})
                                                    </ListItem>
                                                ))}
                                        </UnorderedList>
                                    </ListItem>
                                ))}
                                {itemsNoPeople.length === 0 ? <ListItem>None</ListItem> : undefined}
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
                                {itemsWithPeopleNotSentRequests.map((x) => (
                                    <ListItem key={x.id}>
                                        <Text>{x.title}</Text>
                                        <UnorderedList>
                                            {x.elements
                                                .filter((y) => !y.data?.length)
                                                .map((y) => (
                                                    <ListItem key={y.id}>
                                                        {y.name} ({y.typeName})
                                                    </ListItem>
                                                ))}
                                        </UnorderedList>
                                    </ListItem>
                                ))}
                                {itemsWithPeopleNotSentRequests.length === 0 ? <ListItem>None</ListItem> : undefined}
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
                                {itemsWithSendRequestsMissingSubmissions.map((x) => (
                                    <ListItem key={x.id}>
                                        <Text>{x.title}</Text>
                                        <UnorderedList>
                                            {x.elements
                                                .filter((y) => !y.data?.length)
                                                .map((y) => (
                                                    <ListItem key={y.id}>
                                                        {y.name} ({y.typeName})
                                                    </ListItem>
                                                ))}
                                        </UnorderedList>
                                    </ListItem>
                                ))}
                                {itemsWithSendRequestsMissingSubmissions.length === 0 ? (
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
                                {itemsWithSubmissions.flatMap((x) =>
                                    x.elements
                                        .filter((y) => y.data?.length)
                                        .map((y) => (
                                            <GridItem key={y.id} maxW="500px" border="1px solid black">
                                                <VStack>
                                                    <Heading as="h3" fontSize="md" p={1}>
                                                        {x.title}
                                                    </Heading>
                                                    <Heading as="h4" fontSize="sm" fontWeight="normal" p={1}>
                                                        {y.name} ({y.typeName})
                                                    </Heading>
                                                    <DeferredElement uploadableElement={y} />
                                                </VStack>
                                            </GridItem>
                                        ))
                                )}
                                {itemsWithSubmissions.length === 0 ? <GridItem>None</GridItem> : undefined}
                            </Grid>
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
            </ModalBody>
        </ModalContent>
    );
}

function DeferredElement({
    uploadableElement,
}: {
    uploadableElement: SubmissionsReviewModal_ElementFragment;
}): JSX.Element {
    const { isOpen, onOpen } = useDisclosure();
    return isOpen ? (
        uploadableElement ? (
            <Element element={uploadableElement} />
        ) : (
            <Box p={2}>This element has been submitted but you do not have permission to access it.</Box>
        )
    ) : (
        <Box p={2}>
            <Button onClick={onOpen}>Reveal submission</Button>
        </Box>
    );
}
