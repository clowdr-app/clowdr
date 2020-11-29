import { gql, useApolloClient } from "@apollo/client";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    InputGroup,
    InputRightAddon,
    Tooltip,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik, FormikErrors } from "formik";
import React from "react";
import { useHistory } from "react-router-dom";
import {
    Conference,
    ConferenceTakenDocument,
    ConferenceTakenQuery,
    ConferenceTakenQueryVariables,
    useCreateConferenceMutation,
    useCreateNewConferenceMetaStructureMutation,
} from "../../generated/graphql";
import useCurrentUser from "../Users/CurrentUser/useCurrentUser";
import isValidUUID from "../Utils/isValidUUID";

const _newConferenceQueries = gql`
    query ConferenceTaken($name: String!, $shortName: String!, $slug: String!) {
        Conference(
            where: {
                _or: [
                    { name: { _eq: $name } }
                    { shortName: { _eq: $shortName } }
                    { slug: { _eq: $slug } }
                ]
            }
            limit: 1
        ) {
            id
            name
            shortName
            slug
        }
    }

    mutation CreateConference(
        $name: String!
        $shortName: String!
        $slug: String!
        $demoCode: uuid!
    ) {
        insert_Conference(
            objects: [
                {
                    name: $name
                    shortName: $shortName
                    slug: $slug
                    demoCodeId: $demoCode
                }
            ]
        ) {
            returning {
                id
                slug
            }
        }

        update_ConferenceDemoCode(
            where: { id: { _eq: $demoCode } }
            _set: { note: "Code has been used." }
        ) {
            affected_rows
        }
    }

    mutation CreateNewConferenceMetaStructure(
        $conferenceId: uuid!
        $attendeeDisplayName: String!
        $userId: String!
        $accessStart: timestamptz!
        $accessEnd: timestamptz!
    ) {
        insert_Attendee(
            objects: [
                {
                    displayName: $attendeeDisplayName
                    userId: $userId
                    conferenceId: $conferenceId
                    groupAttendees: {
                        data: {
                            group: {
                                data: {
                                    conferenceId: $conferenceId
                                    accessStart: $accessStart
                                    accessEnd: $accessEnd
                                    includeUnauthenticated: false
                                    name: "Organisers"
                                    groupRoles: {
                                        data: {
                                            role: {
                                                data: {
                                                    conferenceId: $conferenceId
                                                    name: "Organiser"
                                                    rolePermissions: {
                                                        data: [
                                                            {
                                                                permissionName: CONFERENCE_MANAGE_NAME
                                                            }
                                                            {
                                                                permissionName: CONFERENCE_MANAGE_ATTENDEES
                                                            }
                                                            {
                                                                permissionName: CONFERENCE_MODERATE_ATTENDEES
                                                            }
                                                            {
                                                                permissionName: CONFERENCE_VIEW_ACTIVE_ATTENDEES
                                                            }
                                                            {
                                                                permissionName: CONFERENCE_VIEW_BANNED_ATTENDEES
                                                            }
                                                            {
                                                                permissionName: CONFERENCE_VIEW
                                                            }
                                                            {
                                                                permissionName: CONFERENCE_MANAGE_ROLES
                                                            }
                                                            {
                                                                permissionName: CONFERENCE_MANAGE_GROUPS
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        ) {
            affected_rows
        }
    }
`;

export function normaliseName(value: string, trim = true): string {
    let result = value?.replace(/\s\s+/g, " ");
    if (trim) {
        result = result?.trim();
    }
    return result;
}

/**
 * Returns error message or undefined if no errors.
 */
export function validateName(
    inValue: string | null | undefined
): string | undefined {
    let error;
    const value = inValue ? normaliseName(inValue) : undefined;
    if (!value || value.length === 0) {
        error = "Name is required";
    } else if (value.length < 10) {
        error = "Name must be at least 10 characters.";
    }
    return error;
}

/**
 * Returns error message or undefined if no errors.
 */
export function validateShortName(
    inValue: string | null | undefined
): string | undefined {
    let error;
    const value = inValue ? normaliseName(inValue) : undefined;
    if (!value || value.length === 0) {
        error = "Short name is required";
    } else if (value.length < 5) {
        error = "Short name must be at least 5 characters.";
    }
    return error;
}

export default function NewConferenceForm(): JSX.Element {
    const toast = useToast();
    const apolloClient = useApolloClient();
    const history = useHistory();
    const user = useCurrentUser();

    const [createConferenceMutation] = useCreateConferenceMutation();
    const [
        createNewConferenceMetaStructureMutation,
    ] = useCreateNewConferenceMetaStructureMutation();

    function validateDemoCode(value: string | null | undefined) {
        if (!!value && isValidUUID(value)) {
            return undefined;
        } else {
            return "Not a valid demo code.";
        }
    }

    function generateSlug(value: string) {
        return value.replace(/\s/g, "").toLowerCase();
    }

    const year = new Date().getFullYear();

    return (
        <Formik
            initialValues={{
                new_conf_name: "My Awesome Conference " + year,
                new_conf_short_name: "MAC " + year,
                new_conf_demo_code: "",
            }}
            onSubmit={async (_values, actions) => {
                const values = {
                    name: normaliseName(_values.new_conf_name),
                    shortName: normaliseName(_values.new_conf_short_name),
                    slug: generateSlug(
                        normaliseName(_values.new_conf_short_name)
                    ),
                    demoCode: _values.new_conf_demo_code,
                };

                let failed: false | string = false;

                const takenResult = await apolloClient.query<
                    ConferenceTakenQuery,
                    ConferenceTakenQueryVariables
                >({
                    query: ConferenceTakenDocument,
                    variables: values,
                    fetchPolicy: "network-only",
                });
                try {
                    let ok:
                        | boolean
                        | Pick<
                              Conference,
                              "id" | "name" | "shortName" | "slug"
                          > = false;
                    if (takenResult.error) {
                        throw takenResult.error;
                    } else {
                        if (takenResult.data) {
                            if (takenResult.data.Conference.length === 0) {
                                ok = true;
                            } else {
                                ok = takenResult.data.Conference[0];
                            }
                        } else {
                            throw new Error("No 'name taken' data!");
                        }
                    }

                    if (ok === true) {
                        const result = await createConferenceMutation({
                            variables: values,
                        });
                        if (
                            result.errors ||
                            !result.data ||
                            !result.data.insert_Conference ||
                            !result.data.insert_Conference.returning.length
                        ) {
                            toast({
                                title: "Could not create conference",
                                description:
                                    "The name or short name may already be taken or your demo code may have already been used.",
                                status: "error",
                            });
                            // failed = true;
                        } else {
                            failed = false;
                            const conferenceId =
                                result.data.insert_Conference.returning[0].id;

                            await createNewConferenceMetaStructureMutation({
                                variables: {
                                    conferenceId,
                                    attendeeDisplayName: `${user.user.User[0].firstName} ${user.user.User[0].lastName}`,
                                    userId: user.user.User[0].id,
                                    accessStart: new Date().toISOString(),
                                    accessEnd: new Date(
                                        "3000-01-01T00:00+00:00"
                                    ).toISOString(),
                                },
                            });

                            toast({
                                title: "Conference created",
                                status: "success",
                            });
                            history.push(
                                `/conference/${result.data.insert_Conference.returning[0].slug}/manage`
                            );
                        }
                    } else {
                        const errors: FormikErrors<{
                            new_conf_name: string;
                            new_conf_short_name: string;
                        }> = {};
                        if (ok.name === values.name) {
                            errors.new_conf_name =
                                "Name has already been taken";
                        }
                        if (ok.shortName === values.shortName) {
                            errors.new_conf_short_name =
                                "Short name has already been taken";
                        }
                        if (ok.slug === values.slug) {
                            errors.new_conf_short_name =
                                "Short name has already been taken";
                        }
                        actions.setErrors(errors);
                    }
                } catch (e) {
                    failed = e.toString();
                }

                if (failed) {
                    if (
                        failed.includes(
                            "Check constraint violation. insert check constraint failed"
                        )
                    ) {
                        toast({
                            title: "Failed to create conference",
                            description:
                                "We were unable to create your conference as the demo code has already been used.",
                            status: "error",
                            duration: 7000,
                            isClosable: true,
                        });
                    } else {
                        toast({
                            title: "Failed to create conference",
                            description: `An error has occurred while trying to create your conference.
Please contact our tech support to investigate the issue shown below: support@clowdr.org`,
                            status: "error",
                            duration: null,
                            isClosable: true,
                        });
                        toast({
                            title: "Error information",
                            description: failed,
                            status: "info",
                            duration: null,
                            isClosable: true,
                        });
                    }
                }

                actions.setSubmitting(false);
            }}
        >
            {(props) => (
                <Form style={{ width: "100%" }}>
                    <Field name="new_conf_name" validate={validateName}>
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={
                                    !!form.errors.new_conf_name &&
                                    !!form.touched.new_conf_name
                                }
                                isRequired
                            >
                                <FormLabel htmlFor="new_conf_name">
                                    Name
                                </FormLabel>
                                <Input
                                    {...{
                                        ...field,
                                        value: normaliseName(
                                            field.value,
                                            false
                                        ),
                                    }}
                                    id="new_conf_name"
                                    placeholder="Name"
                                />
                                <FormErrorMessage>
                                    {form.errors.new_conf_name}
                                </FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Field
                        name="new_conf_short_name"
                        validate={validateShortName}
                    >
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={
                                    !!form.errors.new_conf_short_name &&
                                    !!form.touched.new_conf_short_name
                                }
                                isRequired
                                marginTop="1em"
                            >
                                <FormLabel htmlFor="new_conf_short_name">
                                    Short name
                                </FormLabel>
                                <Input
                                    {...{
                                        ...field,
                                        value: normaliseName(
                                            field.value,
                                            false
                                        ),
                                    }}
                                    id="new_conf_short_name"
                                    placeholder="Short name"
                                />
                                <FormErrorMessage>
                                    {form.errors.new_conf_short_name}
                                </FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Field
                        name="new_conf_demo_code"
                        validate={validateDemoCode}
                    >
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={
                                    !!form.errors.new_conf_demo_code &&
                                    !!form.touched.new_conf_demo_code
                                }
                                isRequired
                                marginTop="1em"
                            >
                                <FormLabel htmlFor="new_conf_demo_code">
                                    Demo code
                                </FormLabel>
                                <InputGroup>
                                    <Input
                                        {...field}
                                        id="new_conf_demo_code"
                                        placeholder="Demo code"
                                    />
                                    <InputRightAddon>
                                        <Tooltip label="To create a conference, please contact us at demo@clowdr.org to receive your demo code.">
                                            {"What's this?"}
                                        </Tooltip>
                                    </InputRightAddon>
                                </InputGroup>
                                <FormErrorMessage>
                                    {form.errors.new_conf_demo_code}
                                </FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Button
                        mt={4}
                        colorScheme="green"
                        isLoading={props.isSubmitting}
                        type="submit"
                        isDisabled={!props.isValid}
                    >
                        Create
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
