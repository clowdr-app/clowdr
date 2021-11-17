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
    Spinner,
    Text,
    UnorderedList,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { SubmissionsReviewModal_ElementFragment } from "../../../../../../generated/graphql";
import { useSubmissionsReviewModalDataQuery } from "../../../../../../generated/graphql";
import { makeContext } from "../../../../../GQL/make-context";
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
            itemId
            personId
            person {
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
        itemId
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
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
            }),
        []
    );
    const [itemsResponse] = useSubmissionsReviewModalDataQuery({
        variables: {
            itemIds,
        },
        requestPolicy: "network-only",
        context,
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

    const noPeopleList = useMemo(
        () => (
            <UnorderedList>
                {itemsNoPeople.map((x) => (
                    <ListItem key={x.id}>{x.title}</ListItem>
                ))}
                {itemsNoPeople.length === 0 ? <ListItem>None</ListItem> : undefined}
            </UnorderedList>
        ),
        [itemsNoPeople]
    );

    const noRequestsList = useMemo(
        () => (
            <UnorderedList>
                {itemsWithPeopleNotSentRequests.map((x) => (
                    <ListItem key={x.id}>{x.title}</ListItem>
                ))}
                {itemsWithPeopleNotSentRequests.length === 0 ? <ListItem>None</ListItem> : undefined}
            </UnorderedList>
        ),
        [itemsWithPeopleNotSentRequests]
    );

    const awaitingList = useMemo(
        () => (
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
                {itemsWithSendRequestsMissingSubmissions.length === 0 ? <ListItem>None</ListItem> : undefined}
            </UnorderedList>
        ),
        [itemsWithSendRequestsMissingSubmissions]
    );

    const submittedGrid = useMemo(
        () => (
            <Grid
                templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]}
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
        ),
        [itemsWithSubmissions]
    );

    return (
        <ModalContent m={0}>
            <ModalHeader>Review submissions</ModalHeader>
            <ModalCloseButton />
            <ModalBody mb={4}>
                {itemsResponse.fetching ? <Spinner /> : undefined}
                <Accordion allowMultiple={false} allowToggle reduceMotion>
                    <AccordionItem>
                        <AccordionButton>
                            <AccordionIcon />
                            No people
                        </AccordionButton>
                        <AccordionPanel>{noPeopleList}</AccordionPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionButton>
                            <AccordionIcon />
                            Submissions not yet requested
                        </AccordionButton>
                        <AccordionPanel>{noRequestsList}</AccordionPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionButton>
                            <AccordionIcon />
                            Awaiting submission
                        </AccordionButton>
                        <AccordionPanel>{awaitingList}</AccordionPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionButton>
                            <AccordionIcon />
                            Submission received
                        </AccordionButton>
                        <AccordionPanel>{submittedGrid}</AccordionPanel>
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
