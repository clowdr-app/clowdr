import { gql } from "@apollo/client";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useMemo, useState } from "react";
import {
    useChooseContentItemModal_GetContentGroupsQuery,
    useChooseContentItemModal_GetVideoContentItemsQuery,
} from "../../../../generated/graphql";
import { useConference } from "../../useConference";

gql`
    query ChooseContentItemModal_GetContentGroups($conferenceId: uuid!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId } }, order_by: { title: asc }) {
            id
            title
        }
    }

    query ChooseContentItemModal_GetVideoContentItems($contentGroupId: uuid) {
        ContentItem(
            where: {
                contentGroupId: { _eq: $contentGroupId }
                contentTypeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST, VIDEO_PREPUBLISH] }
            }
            order_by: { name: asc }
        ) {
            id
            name
        }
    }
`;

export function ChooseContentItemModal({
    isOpen,
    onClose,
    chooseItem,
}: {
    isOpen: boolean;
    onClose: () => void;
    chooseItem: (contentItemId: string) => void;
}): JSX.Element {
    const conference = useConference();
    const contentGroupsResult = useChooseContentItemModal_GetContentGroupsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const [contentGroupId, setContentGroupId] = useState<string | null>(null);

    const contentGroupOptions = useMemo(() => {
        return contentGroupsResult.data?.ContentGroup.map((contentGroup) => (
            <option key={contentGroup.id} value={contentGroup.id}>
                {contentGroup.title}
            </option>
        ));
    }, [contentGroupsResult.data?.ContentGroup]);

    const contentItemsResult = useChooseContentItemModal_GetVideoContentItemsQuery({
        variables: {
            contentGroupId,
        },
    });

    const contentItemOptions = useMemo(() => {
        return contentItemsResult.data?.ContentItem.map((contentItem) => (
            <option key={contentItem.id} value={contentItem.id}>
                {contentItem.name}
            </option>
        ));
    }, [contentItemsResult.data?.ContentItem]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Formik<{ contentItemId: string | null; attendeeGoogleAccountId: string | null }>
                initialValues={{ contentItemId: null, attendeeGoogleAccountId: null }}
                onSubmit={(values, actions) => {
                    if (values.contentItemId) {
                        chooseItem(values.contentItemId);
                        actions.resetForm();
                        onClose();
                    } else {
                        actions.setFieldError("contentItemId", "Must pick a video");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>Choose a video</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Field name="contentItemId">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.contentItemId && !!form.touched.contentItemId}
                                            isRequired
                                        >
                                            <FormLabel htmlFor="contentItemId" mt={2}>
                                                Content Item
                                            </FormLabel>
                                            <Select
                                                placeholder="Choose item"
                                                onChange={(event) => setContentGroupId(event.target.value)}
                                            >
                                                {contentGroupOptions}
                                            </Select>
                                            <Select {...field} id="contentItemId" placeholder="Choose file" mt={2}>
                                                {contentItemOptions}
                                            </Select>
                                            <FormErrorMessage>{form.errors.contentItemId}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            </ModalBody>
                            <ModalFooter>
                                <Button type="submit" isLoading={isSubmitting} mt={4} colorScheme="green">
                                    Choose video
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
