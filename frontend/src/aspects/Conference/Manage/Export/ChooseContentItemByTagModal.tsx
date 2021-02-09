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
    useChooseContentItemByTagModal_GetTagsQuery,
    useChooseContentItemByTagModal_GetVideoContentItemsQuery,
} from "../../../../generated/graphql";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";

gql`
    query ChooseContentItemByTagModal_GetTags($conferenceId: uuid!) {
        Tag(where: { conferenceId: { _eq: $conferenceId } }, order_by: { name: asc }) {
            id
            name
        }
    }

    query ChooseContentItemByTagModal_GetVideoContentItems($tagId: uuid!, $name: String!) {
        ContentItem(
            where: {
                contentTypeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST, VIDEO_PREPUBLISH] }
                contentGroup: { contentGroupTags: { tag: { id: { _eq: $tagId } } } }
                name: { _ilike: $name }
            }
            order_by: { contentGroup: { title: asc }, name: asc }
        ) {
            id
            name
            contentGroup {
                id
                title
            }
        }
    }
`;

export function ChooseContentItemByTagModal({
    isOpen,
    onClose,
    chooseItems,
}: {
    isOpen: boolean;
    onClose: () => void;
    chooseItems: (contentItemIds: string[]) => void;
}): JSX.Element {
    const conference = useConference();
    const tagsResult = useChooseContentItemByTagModal_GetTagsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const [tagId, setTagId] = useState<string | null>(null);

    const tagOptions = useMemo(() => {
        return tagsResult.data?.Tag.map((tag) => (
            <option key={tag.id} value={tag.id}>
                {tag.name}
            </option>
        ));
    }, [tagsResult.data?.Tag]);

    const [searchString, setSearchString] = useState<string | null>(null);

    const contentItemsResult = useChooseContentItemByTagModal_GetVideoContentItemsQuery({
        variables: {
            tagId,
            name: searchString ?? "%%",
        },
    });

    const contentItems = useMemo(() => {
        return (
            <Box mt={4}>
                {contentItemsResult.loading ? (
                    <Spinner />
                ) : contentItemsResult.error ? (
                    <Text>Could not retrieve list of files.</Text>
                ) : contentItemsResult.data && contentItemsResult.data.ContentItem.length === 0 ? (
                    <Text>No matching files.</Text>
                ) : undefined}
                <List spacing={2} maxH="40vh" overflowY="auto">
                    {contentItemsResult.data?.ContentItem.map((contentItem) => (
                        <ListItem key={contentItem.id}>
                            <HStack>
                                <FAIcon icon="video" iconStyle="s" mr={2} fontSize="sm" />
                                <VStack alignItems="flex-start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="bold">
                                        {contentItem.name}
                                    </Text>
                                    <Text fontSize="sm" mt={0}>
                                        {contentItem.contentGroup.title}
                                    </Text>
                                </VStack>
                            </HStack>
                        </ListItem>
                    ))}
                </List>
            </Box>
        );
    }, [contentItemsResult]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <Formik<{ tagId: string | null; searchString: string | null }>
                initialValues={{ tagId: null, searchString: null }}
                onSubmit={(_values, actions) => {
                    if (contentItemsResult.data) {
                        chooseItems(contentItemsResult.data.ContentItem.map((item) => item.id));
                        actions.resetForm();
                        onClose();
                    } else {
                        actions.setFieldError("contentItemIds", "Must pick at least one video");
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
                                            <FormErrorMessage>{form.errors.contentItemIds}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                {contentItems}
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    isDisabled={
                                        !isValid ||
                                        contentItemsResult.loading ||
                                        (contentItemsResult.data && contentItemsResult.data.ContentItem.length === 0)
                                    }
                                    mt={4}
                                    colorScheme="green"
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
