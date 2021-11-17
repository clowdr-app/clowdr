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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import React, { useMemo, useState } from "react";
import { gql } from "urql";
import {
    useChooseElementModal_GetItemsQuery,
    useChooseElementModal_GetVideoElementsQuery,
} from "../../../../../generated/graphql";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";

gql`
    query ChooseElementModal_GetItems($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId } }, order_by: { title: asc }) {
            id
            title
            conferenceId
        }
    }

    query ChooseElementModal_GetVideoElements($itemId: uuid) {
        content_Element(
            where: { itemId: { _eq: $itemId }, typeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST, VIDEO_PREPUBLISH] } }
            order_by: { name: asc }
        ) {
            id
            name
            typeName
            itemId
        }
    }
`;

export function ChooseElementModal({
    isOpen,
    onClose,
    chooseItem,
}: {
    isOpen: boolean;
    onClose: () => void;
    chooseItem: (elementId: string) => void;
}): JSX.Element {
    const conference = useConference();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
            }),
        []
    );
    const [itemsResult] = useChooseElementModal_GetItemsQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });

    const [itemId, setItemId] = useState<string | null>(null);

    const itemOptions = useMemo(() => {
        return itemsResult.data?.content_Item.map((item) => (
            <option key={item.id} value={item.id}>
                {item.title}
            </option>
        ));
    }, [itemsResult.data?.content_Item]);

    const [elementsResult] = useChooseElementModal_GetVideoElementsQuery({
        variables: {
            itemId,
        },
        context,
    });

    const elementOptions = useMemo(() => {
        return elementsResult.data?.content_Element.map((element) => (
            <option key={element.id} value={element.id}>
                {element.name}
            </option>
        ));
    }, [elementsResult.data?.content_Element]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Formik<{ elementId: string | null; registrantGoogleAccountId: string | null }>
                initialValues={{ elementId: null, registrantGoogleAccountId: null }}
                onSubmit={(values, actions) => {
                    if (values.elementId) {
                        chooseItem(values.elementId);
                        actions.resetForm();
                        onClose();
                    } else {
                        actions.setFieldError("elementId", "Must pick a video");
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
                                <Field name="elementId">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.elementId && !!form.touched.elementId}
                                            isRequired
                                        >
                                            <FormLabel htmlFor="elementId" mt={2}>
                                                Content Item
                                            </FormLabel>
                                            <Select
                                                placeholder="Choose item"
                                                onChange={(event) => setItemId(event.target.value)}
                                            >
                                                {itemOptions}
                                            </Select>
                                            <Select {...field} id="elementId" placeholder="Choose file" mt={2}>
                                                {elementOptions}
                                            </Select>
                                            <FormErrorMessage>{form.errors.elementId}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            </ModalBody>
                            <ModalFooter>
                                <Button type="submit" isLoading={isSubmitting} mt={4} colorScheme="purple">
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
