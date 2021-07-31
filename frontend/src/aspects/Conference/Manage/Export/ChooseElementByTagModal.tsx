import { gql } from "@apollo/client";
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useMemo, useState } from "react";
import {
    useChooseElementByTagModal_GetTagsQuery,
    useChooseElementByTagModal_GetVideoElementsQuery,
} from "../../../../generated/graphql";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";

gql`
    query ChooseElementByTagModal_GetTags($conferenceId: uuid!) {
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }, order_by: { name: asc }) {
            id
            name
        }
    }

    query ChooseElementByTagModal_GetVideoElements($tagId: uuid!, $name: String!) {
        content_Element(
            where: {
                typeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST, VIDEO_PREPUBLISH] }
                item: { itemTags: { tag: { id: { _eq: $tagId } } } }
                name: { _ilike: $name }
            }
            order_by: [{ item: { title: asc } }, { name: asc }]
        ) {
            id
            name
            item {
                id
                title
            }
        }
    }
`;

export function ChooseElementByTagModal({
    isOpen,
    onClose,
    chooseItems,
}: {
    isOpen: boolean;
    onClose: () => void;
    chooseItems: (elementIds: string[]) => void;
}): JSX.Element {
    const conference = useConference();
    const tagsResult = useChooseElementByTagModal_GetTagsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const [tagId, setTagId] = useState<string | null>(null);

    const tagOptions = useMemo(() => {
        return tagsResult.data?.collection_Tag.map((tag) => (
            <option key={tag.id} value={tag.id}>
                {tag.name}
            </option>
        ));
    }, [tagsResult.data?.collection_Tag]);

    const [searchString, setSearchString] = useState<string | null>(null);

    const elementsResult = useChooseElementByTagModal_GetVideoElementsQuery({
        variables: {
            tagId,
            name: searchString ?? "%%",
        },
    });

    const elements = useMemo(() => {
        return (
            <Box mt={4}>
                {elementsResult.loading ? (
                    <Spinner />
                ) : elementsResult.error ? (
                    <Text>Could not retrieve list of files.</Text>
                ) : elementsResult.data && elementsResult.data.content_Element.length === 0 ? (
                    <Text>No matching files.</Text>
                ) : undefined}
                <List spacing={2} maxH="40vh" overflowY="auto">
                    {elementsResult.data?.content_Element.map((element) => (
                        <ListItem key={element.id}>
                            <HStack>
                                <FAIcon icon="video" iconStyle="s" mr={2} fontSize="sm" />
                                <VStack alignItems="flex-start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="bold">
                                        {element.name}
                                    </Text>
                                    <Text fontSize="sm" mt={0}>
                                        {element.item.title}
                                    </Text>
                                </VStack>
                            </HStack>
                        </ListItem>
                    ))}
                </List>
            </Box>
        );
    }, [elementsResult]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <Formik<{ tagId: string | null; searchString: string | null }>
                initialValues={{ tagId: null, searchString: null }}
                onSubmit={(_values, actions) => {
                    if (elementsResult.data) {
                        chooseItems(elementsResult.data.content_Element.map((item) => item.id));
                        actions.resetForm();
                        onClose();
                    } else {
                        actions.setFieldError("elementIds", "Must pick at least one video");
                        actions.setSubmitting(false);
                    }
                }}
            >
                {({ isSubmitting, isValid }) => (
                    <Form>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>Choose a tag</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Field name="tagId">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl isInvalid={!!form.errors.tagId && !!form.touched.tagId} isRequired>
                                            <FormLabel htmlFor="tagId" mt={2}>
                                                Content Item
                                            </FormLabel>
                                            <Select
                                                {...field}
                                                id="tagId"
                                                placeholder="Choose tag"
                                                mt={2}
                                                onChange={(event) => setTagId(event.target.value)}
                                            >
                                                {tagOptions}
                                            </Select>
                                            <FormErrorMessage>{form.errors.tagId}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="searchString">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.searchString && !!form.touched.searchString}
                                        >
                                            <FormLabel htmlFor="searchString" mt={2}>
                                                File name
                                            </FormLabel>
                                            <FormHelperText>
                                                Use a search string to narrow down the files you want. You can use % as
                                                a wildcard.
                                            </FormHelperText>
                                            <Input
                                                {...field}
                                                id="searchString"
                                                placeholder="%file name%"
                                                mt={2}
                                                onChange={(event) => setSearchString(event.target.value)}
                                            />
                                            <FormErrorMessage>{form.errors.searchString}</FormErrorMessage>
                                            <FormErrorMessage>{form.errors.elementIds}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                {elements}
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    isDisabled={
                                        !isValid ||
                                        elementsResult.loading ||
                                        (elementsResult.data && elementsResult.data.content_Element.length === 0)
                                    }
                                    mt={4}
                                    colorScheme="purple"
                                >
                                    Add videos
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
