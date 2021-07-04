import { gql } from "@apollo/client";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightAddon,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Text,
    Tooltip,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Permissions_Permission_Enum, useUpdateConferenceMutation } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import FAIcon from "../../Icons/FAIcon";
import UnsavedChangesWarning from "../../LeavingPageWarnings/UnsavedChangesWarning";
import { useTitle } from "../../Utils/useTitle";
import { validateName, validateShortName } from "../NewConferenceForm";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";

const _updateConferenceQueries = gql`
    mutation UpdateConference($id: uuid!, $name: String = "", $shortName: String = "", $slug: String = "") {
        update_conference_Conference(
            where: { id: { _eq: $id } }
            _set: { name: $name, shortName: $shortName, slug: $slug }
        ) {
            returning {
                id
                name
                shortName
                slug
            }
        }
    }
`;

export function normaliseSlug(value: string | null | undefined): string | undefined {
    return value?.replace(/\s/g, "");
}

export function validateSlug(inValue: string | null | undefined): string | undefined {
    let error;

    const value = inValue ? normaliseSlug(inValue) : undefined;
    if (!value || value.length === 0) {
        error = "URL slug is required";
    } else if (value.length < 5) {
        error = "URL slug must be at least 5 characters.";
    }

    return error;
}

export default function ManageName(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage name of ${conference.shortName}`);

    const [slugWarningAccepted, setSlugWarningAccepted] = useState<boolean>(false);
    const [updateConferenceMutation] = useUpdateConferenceMutation();
    const toast = useToast();
    const history = useHistory();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageName]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Name, short name and url
            </Heading>
            <Formik
                initialValues={{
                    name: conference.name,
                    shortName: conference.shortName,
                    slug: conference.slug,
                }}
                onSubmit={async (values) => {
                    try {
                        const variables = {
                            id: conference.id,
                            name: values.name,
                            shortName: values.shortName,
                            slug: slugWarningAccepted ? values.slug : conference.slug,
                        };
                        const result = await updateConferenceMutation({
                            variables,
                        });

                        if (result.errors || !result.data) {
                            throw new Error(JSON.stringify(result.errors));
                        } else {
                            toast({
                                title: "Changes saved",
                                status: "success",
                            });

                            if (conference.slug !== variables.slug) {
                                history.push(`/conference/${variables.slug}/manage/details`);
                            }
                        }
                    } catch (e) {
                        const msg = e.toString();
                        let expectedError: false | string = false;
                        if (msg.includes("Uniqueness violation")) {
                            if (msg.includes("Conference_name_key")) {
                                expectedError = "Name already taken.";
                            } else if (msg.includes("Conference_shortName_key")) {
                                expectedError = "Short name already taken.";
                            } else if (msg.includes("Conference_slug_key")) {
                                expectedError = "URL slug already taken.";
                            }
                        }

                        if (expectedError) {
                            toast({
                                title: "Failed to save changes",
                                description: expectedError,
                                status: "error",
                                duration: 7000,
                                isClosable: true,
                            });
                        } else {
                            toast({
                                title: "Failed to save changes",
                                description: `An error has occurred while trying to save your changes.
    Please contact our tech support to investigate the issue shown below: support@clowdr.org`,
                                status: "error",
                                duration: null,
                                isClosable: true,
                            });
                            toast({
                                title: "Error information",
                                description: msg,
                                status: "info",
                                duration: null,
                                isClosable: true,
                            });
                        }
                    }
                }}
            >
                {({ dirty, ...props }) => (
                    <>
                        <UnsavedChangesWarning hasUnsavedChanges={dirty} />
                        <Form>
                            <Field name="name" validate={validateName}>
                                {({ field, form }: FieldProps<string>) => (
                                    <FormControl isInvalid={!!form.errors.name && !!form.touched.name} isRequired>
                                        <FormLabel htmlFor="name">Name</FormLabel>
                                        <Input {...field} id="name" type="text" />
                                        <FormHelperText>The long-form name of your conference.</FormHelperText>
                                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="shortName" validate={validateShortName}>
                                {({ field, form }: FieldProps<string>) => (
                                    <FormControl
                                        isInvalid={!!form.errors.shortName && !!form.touched.shortName}
                                        isRequired
                                        marginTop="1em"
                                    >
                                        <FormLabel htmlFor="shortName">Short Name</FormLabel>
                                        <Input {...field} id="shortName" type="text" />
                                        <FormHelperText>
                                            The short-form name of your conference (e.g. its acronym and year such as
                                            MAC 2020).
                                        </FormHelperText>
                                        <FormErrorMessage>{form.errors.shortName}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="slug" validate={validateSlug}>
                                {({ field, form }: FieldProps<string>) => (
                                    <FormControl
                                        isInvalid={!!form.errors.slug && !!form.touched.slug}
                                        isRequired
                                        isDisabled={!slugWarningAccepted}
                                        marginTop="1em"
                                    >
                                        <FormLabel htmlFor="slug">URL slug</FormLabel>
                                        <Tooltip
                                            label={
                                                !slugWarningAccepted
                                                    ? "Please accept the warning to enable editing."
                                                    : ""
                                            }
                                        >
                                            <InputGroup>
                                                <InputLeftAddon>/</InputLeftAddon>
                                                <Input
                                                    {...{
                                                        ...field,
                                                        value: normaliseSlug(field.value),
                                                    }}
                                                    id="slug"
                                                    type="text"
                                                />
                                                <InputRightAddon padding={0}>
                                                    <Popover>
                                                        <PopoverTrigger>
                                                            <Button
                                                                margin={0}
                                                                borderTopLeftRadius="0"
                                                                borderBottomLeftRadius="0"
                                                                colorScheme="yellow"
                                                                aria-label="Read URL slug warning"
                                                            >
                                                                <FAIcon
                                                                    iconStyle="s"
                                                                    icon="exclamation-triangle"
                                                                    marginRight="0.5em"
                                                                />
                                                                Read warning
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent bgColor="yellow.200" color="black">
                                                            <PopoverArrow bgColor="yellow.200" />
                                                            <PopoverCloseButton />
                                                            <PopoverHeader fontWeight="bold">Warning!</PopoverHeader>
                                                            <PopoverBody whiteSpace="normal">
                                                                <Text>
                                                                    <b>
                                                                        We strongly discourage you from changing your
                                                                        conference&apos;s URL.
                                                                    </b>{" "}
                                                                    Changing the url slug will break all existing links
                                                                    including invitation links.
                                                                </Text>
                                                                <Text textAlign="center">
                                                                    <Button
                                                                        onClick={() => setSlugWarningAccepted(true)}
                                                                    >
                                                                        Accept
                                                                    </Button>
                                                                </Text>
                                                            </PopoverBody>
                                                        </PopoverContent>
                                                    </Popover>
                                                </InputRightAddon>
                                            </InputGroup>
                                        </Tooltip>
                                        <FormHelperText>
                                            The identifying part of the url for your conference.
                                        </FormHelperText>
                                        <FormErrorMessage>{form.errors.slug}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Button
                                mt={4}
                                colorScheme="purple"
                                isLoading={props.isSubmitting}
                                type="submit"
                                isDisabled={!props.isValid || !dirty}
                            >
                                Save changes
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </RequireAtLeastOnePermissionWrapper>
    );
}
