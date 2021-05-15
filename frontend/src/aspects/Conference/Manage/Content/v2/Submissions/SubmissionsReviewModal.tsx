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
    SubmissionsReviewModal_UploadableElementFragment,
    useSubmissionsReviewModalDataQuery,
} from "../../../../../../generated/graphql";
import { Element } from "../../../../Attend/Content/Element/Element";

gql`
    query SubmissionsReviewModalData($itemIds: [uuid!]!) {
        content_UploadableElement(where: { itemId: { _in: $itemIds } }) {
            ...SubmissionsReviewModal_UploadableElement
        }
    }

    fragment SubmissionsReviewModal_UploadableElement on content_UploadableElement {
        id
        itemId
        typeName
        name
        uploadsRemaining
        itemTitle
        hasBeenUploaded
        uploaders {
            id
            email
            name
            emailsSentCount
        }
        element {
            ...ElementData
        }
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
    const uploadableElementsResponse = useSubmissionsReviewModalDataQuery({
        variables: {
            itemIds,
        },
    });
    const sortedUploadableElements = useMemo(
        () =>
            uploadableElementsResponse.data?.content_UploadableElement
                ? R.sortBy((x) => x.itemTitle ?? "", uploadableElementsResponse.data.content_UploadableElement)
                : [],
        [uploadableElementsResponse.data?.content_UploadableElement]
    );

    const uploadableElementsNoUploaders = useMemo(
        () => sortedUploadableElements.filter((x) => x.uploaders.length === 0 && !x.hasBeenUploaded),
        [sortedUploadableElements]
    );
    const uploadableElementsNoSentRequests = useMemo(
        () =>
            sortedUploadableElements.filter(
                (x) =>
                    x.uploaders.length !== 0 && x.uploaders.every((z) => z.emailsSentCount === 0) && !x.hasBeenUploaded
            ),
        [sortedUploadableElements]
    );
    const uploadableElementsWithSendRequestsNoSubmissions = useMemo(
        () =>
            sortedUploadableElements.filter(
                (x) =>
                    x.uploaders.length !== 0 && x.uploaders.some((z) => z.emailsSentCount !== 0) && !x.hasBeenUploaded
            ),
        [sortedUploadableElements]
    );
    const uploadableElementsWithSubmissions = useMemo(() => sortedUploadableElements.filter((x) => x.hasBeenUploaded), [
        sortedUploadableElements,
    ]);

    return (
        <ModalContent m={0}>
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
                                {Object.values(R.groupBy((x) => x.itemId, uploadableElementsNoUploaders)).map((x) => (
                                    <ListItem key={x[0].itemId}>
                                        <Text>{x[0].itemTitle}</Text>
                                        <UnorderedList>
                                            {x.map((y) => (
                                                <ListItem key={y.id}>
                                                    {y.name} ({y.typeName})
                                                </ListItem>
                                            ))}
                                        </UnorderedList>
                                    </ListItem>
                                ))}
                                {uploadableElementsNoUploaders.length === 0 ? <ListItem>None</ListItem> : undefined}
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
                                {Object.values(R.groupBy((x) => x.itemId, uploadableElementsNoSentRequests)).map(
                                    (x) => (
                                        <ListItem key={x[0].itemId}>
                                            <Text>{x[0].itemTitle}</Text>
                                            <UnorderedList>
                                                {x.map((y) => (
                                                    <ListItem key={y.id}>
                                                        {y.name} ({y.typeName})
                                                    </ListItem>
                                                ))}
                                            </UnorderedList>
                                        </ListItem>
                                    )
                                )}
                                {uploadableElementsNoSentRequests.length === 0 ? <ListItem>None</ListItem> : undefined}
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
                                {Object.values(
                                    R.groupBy((x) => x.itemId, uploadableElementsWithSendRequestsNoSubmissions)
                                ).map((x) => (
                                    <ListItem key={x[0].itemId}>
                                        <Text>{x[0].itemTitle}</Text>
                                        <UnorderedList>
                                            {x.map((y) => (
                                                <ListItem key={y.id}>
                                                    {y.name} ({y.typeName})
                                                </ListItem>
                                            ))}
                                        </UnorderedList>
                                    </ListItem>
                                ))}
                                {uploadableElementsWithSendRequestsNoSubmissions.length === 0 ? (
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
                                {Object.values(R.groupBy((x) => x.itemId, uploadableElementsWithSubmissions)).reduce(
                                    (accOuter, x) => [
                                        ...accOuter,
                                        ...x.map(
                                            (y) => (
                                                <GridItem key={y.id} maxW="500px" border="1px solid black">
                                                    <VStack>
                                                        <Heading as="h3" fontSize="md" p={1}>
                                                            {y.itemTitle}
                                                        </Heading>
                                                        <Heading as="h4" fontSize="sm" fontWeight="normal" p={1}>
                                                            {y.name} ({y.typeName})
                                                        </Heading>
                                                        <DeferredElement uploadableElement={y} />
                                                    </VStack>
                                                </GridItem>
                                            ),
                                            [] as JSX.Element[]
                                        ),
                                    ],
                                    [] as JSX.Element[]
                                )}
                                {uploadableElementsWithSubmissions.length === 0 ? <GridItem>None</GridItem> : undefined}
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
    uploadableElement: SubmissionsReviewModal_UploadableElementFragment;
}): JSX.Element {
    const { isOpen, onOpen } = useDisclosure();
    return isOpen ? (
        uploadableElement.element ? (
            <Element element={uploadableElement.element} />
        ) : (
            <Box p={2}>This element has been submitted but you do not have permission to access it.</Box>
        )
    ) : (
        <Box p={2}>
            <Button onClick={onOpen}>Reveal submission</Button>
        </Box>
    );
}
