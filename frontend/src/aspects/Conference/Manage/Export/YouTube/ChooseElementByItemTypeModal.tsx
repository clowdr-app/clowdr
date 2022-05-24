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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import React, { useMemo, useState } from "react";
import { gql } from "urql";
import {
    Content_ItemType_Enum,
    useChooseElementByItemTypeModal_GetTypesQuery,
    useChooseElementByItemTypeModal_GetVideoElementsQuery,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";

gql`
    query ChooseElementByItemTypeModal_GetTypes @cached {
        content_ItemType(order_by: [{ name: asc }]) {
            name
        }
    }

    query ChooseElementByItemTypeModal_GetVideoElements(
        $typeName: content_ItemType_enum!
        $name: String!
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
    ) {
        content_Element(
            where: {
                typeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST, VIDEO_PREPUBLISH] }
                item: { typeName: { _eq: $typeName } }
                name: { _ilike: $name }
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
            }
            order_by: [{ item: { title: asc } }, { name: asc }]
        ) {
            id
            name
            typeName
            itemId
            item {
                id
                title
            }
        }
    }
`;

function formatEnumValueForLabel(value: string): string {
    const parts = value.split("_");
    return parts.reduce((acc, x) => `${acc} ${x[0]}${x.substr(1).toLowerCase()}`, "").trimStart();
}

export function ChooseElementByItemTypeModal({
    isOpen,
    onClose,
    chooseItems,
}: {
    isOpen: boolean;
    onClose: () => void;
    chooseItems: (elementIds: string[]) => void;
}): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext(
                {
                    [AuthHeader.Role]: subconferenceId
                        ? HasuraRoleName.SubconferenceOrganizer
                        : HasuraRoleName.ConferenceOrganizer,
                },
                []
            ),
        [subconferenceId]
    );
    const [typesResult] = useChooseElementByItemTypeModal_GetTypesQuery({
        context,
    });

    const [typeName, setTypeName] = useState<Content_ItemType_Enum>(Content_ItemType_Enum.Session);

    const typeOptions = useMemo(() => {
        return typesResult.data?.content_ItemType.map((type) => (
            <option key={type.name} value={type.name}>
                {formatEnumValueForLabel(type.name)}
            </option>
        ));
    }, [typesResult.data?.content_ItemType]);

    const [searchString, setSearchString] = useState<string | null>(null);

    const [elementsResult] = useChooseElementByItemTypeModal_GetVideoElementsQuery({
        variables: {
            typeName,
            name: searchString ?? "%%",
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });

    const elements = useMemo(() => {
        return (
            <Box mt={4}>
                {elementsResult.fetching ? (
                    <Spinner />
                ) : elementsResult.error ? (
                    <Text>Could not retrieve list of elements.</Text>
                ) : elementsResult.data && elementsResult.data.content_Element.length === 0 ? (
                    <Text>No matching elements.</Text>
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
            <Formik<{ typeName: Content_ItemType_Enum; searchString: string | null }>
                initialValues={{ typeName: Content_ItemType_Enum.Session, searchString: null }}
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
                            <ModalHeader>Choose a type</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Field name="typeName">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.typeName && !!form.touched.typeName}
                                            isRequired
                                        >
                                            <FormLabel htmlFor="typeName" mt={2}>
                                                Content Item
                                            </FormLabel>
                                            <Select
                                                {...field}
                                                id="typeName"
                                                placeholder="Choose type"
                                                mt={2}
                                                onChange={(event) =>
                                                    setTypeName(event.target.value as Content_ItemType_Enum)
                                                }
                                            >
                                                {typeOptions}
                                            </Select>
                                            <FormErrorMessage>{form.errors.typeName}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="searchString">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.searchString && !!form.touched.searchString}
                                        >
                                            <FormLabel htmlFor="searchString" mt={2}>
                                                Element name
                                            </FormLabel>
                                            <FormHelperText>
                                                Use a search string to narrow down the elements you want. You can use %
                                                as a wildcard.
                                            </FormHelperText>
                                            <Input
                                                {...field}
                                                id="searchString"
                                                placeholder="%element name%"
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
                                        elementsResult.fetching ||
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
