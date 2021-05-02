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
import React, { useMemo } from "react";
import { Element } from "../../Attend/Content/Element/Element";
import type { ElementDescriptor, ItemDescriptor } from "./Types";

export function SubmissionReviewModal({
    isOpen,
    onClose,
    items,
}: {
    isOpen: boolean;
    onClose: () => void;
    items: ItemDescriptor[];
}): JSX.Element {
    const sortedGroups = useMemo(() => items.sort((x, y) => x.title.localeCompare(y.title)), [items]);

    const groupsWithItemsNoUploaders = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.uploadableElements.some(
                    (y) =>
                        y.uploaders.length === 0 &&
                        !sortedGroups.some((g) => g.elements.some((i) => i.uploadableId === y.id))
                )
            ),
        [sortedGroups]
    );
    const groupsWithItemsNoSentRequests = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.uploadableElements.some(
                    (y) =>
                        y.uploaders.length !== 0 &&
                        y.uploaders.every((z) => z.emailsSentCount === 0) &&
                        !sortedGroups.some((g) => g.elements.some((i) => i.uploadableId === y.id))
                )
            ),
        [sortedGroups]
    );
    const groupsWithSendRequestsNoSubmissions = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.uploadableElements.some(
                    (y) =>
                        y.uploaders.length !== 0 &&
                        y.uploaders.some((z) => z.emailsSentCount !== 0) &&
                        !sortedGroups.some((g) => g.elements.some((i) => i.uploadableId === y.id))
                )
            ),
        [sortedGroups]
    );
    const groupsWithSubmissions = useMemo(
        () =>
            sortedGroups.filter((x) =>
                x.uploadableElements.some((y) =>
                    sortedGroups.some((g) => g.elements.some((i) => i.uploadableId === y.id))
                )
            ),
        [sortedGroups]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered scrollBehavior="inside">
            <ModalOverlay />
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
                                    {groupsWithItemsNoUploaders.map((x) => (
                                        <ListItem key={x.id}>
                                            <Text>{x.title}</Text>
                                            <UnorderedList>
                                                {x.uploadableElements
                                                    .filter(
                                                        (y) =>
                                                            y.uploaders.length === 0 &&
                                                            !sortedGroups.some((g) =>
                                                                g.elements.some((i) => i.uploadableId === y.id)
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
                                                {x.uploadableElements
                                                    .filter(
                                                        (y) =>
                                                            y.uploaders.length !== 0 &&
                                                            y.uploaders.every((z) => z.emailsSentCount === 0) &&
                                                            !sortedGroups.some((g) =>
                                                                g.elements.some((i) => i.uploadableId === y.id)
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
                                                {x.uploadableElements
                                                    .filter(
                                                        (y) =>
                                                            y.uploaders.length !== 0 &&
                                                            y.uploaders.some((z) => z.emailsSentCount !== 0) &&
                                                            !sortedGroups.some((g) =>
                                                                g.elements.some((i) => i.uploadableId === y.id)
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
                                            ...x.uploadableElements.reduce((acc, y) => {
                                                const item = sortedGroups.reduce<ElementDescriptor | undefined>(
                                                    (acc, g) => acc ?? g.elements.find((i) => i.uploadableId === y.id),
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
                                                                <DeferredElement item={item} />
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

function DeferredElement({ item }: { item: ElementDescriptor }): JSX.Element {
    const { isOpen, onOpen } = useDisclosure();
    return isOpen ? (
        <Element
            item={{
                ...item,
                typeName: item.typeName,
            }}
        />
    ) : (
        <Box pb={2}>
            <Button onClick={onOpen}>Reveal item</Button>
        </Box>
    );
}
