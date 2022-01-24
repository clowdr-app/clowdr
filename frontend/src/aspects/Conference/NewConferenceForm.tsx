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
import type { FieldProps, FormikErrors } from "formik";
import { Field, Form, Formik } from "formik";
import React from "react";
import { useHistory } from "react-router-dom";
import type {
    ConferenceTakenQuery,
    ConferenceTakenQueryVariables,
    Conference_Conference} from "../../generated/graphql";
import {
    ConferenceTakenDocument,
    useCreateConferenceMutation,
    useCreateNewConferenceMetaStructureMutation,
} from "../../generated/graphql";
import useCurrentUser from "../Users/CurrentUser/useCurrentUser";
import isValidUUID from "../Utils/isValidUUID";
import { FormattedMessage, useIntl } from "react-intl";

gql`
    query ConferenceTaken($name: String!, $shortName: String!, $slug: String!) {
        conference_Conference(
            where: { _or: [{ name: { _eq: $name } }, { shortName: { _eq: $shortName } }, { slug: { _eq: $slug } }] }
        ) {
            id
            name
            shortName
            slug
        }
    }

    mutation CreateConference($name: String!, $shortName: String!, $slug: String!, $demoCode: uuid!) {
        insert_conference_Conference(
            objects: [{ name: $name, shortName: $shortName, slug: $slug, demoCodeId: $demoCode }]
        ) {
            returning {
                id
                slug
            }
        }

        update_conference_DemoCode(where: { id: { _eq: $demoCode } }, _set: { note: "Code has been used." }) {
            affected_rows
        }
    }

    mutation CreateNewConferenceMetaStructure(
        $conferenceId: uuid!
        $registrantDisplayName: String!
        $userId: String!
        $abstractData: jsonb!
        $itemListData: jsonb!
    ) {
        insert_registrant_Registrant(
            objects: [
                {
                    displayName: $registrantDisplayName
                    userId: $userId
                    conferenceId: $conferenceId
                    groupRegistrants: {
                        data: {
                            group: {
                                data: {
                                    conferenceId: $conferenceId
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
                                                            { permissionName: CONFERENCE_MANAGE_NAME }
                                                            { permissionName: CONFERENCE_MANAGE_ATTENDEES }
                                                            { permissionName: CONFERENCE_MODERATE_ATTENDEES }
                                                            { permissionName: CONFERENCE_VIEW_ATTENDEES }
                                                            { permissionName: CONFERENCE_VIEW }
                                                            { permissionName: CONFERENCE_MANAGE_ROLES }
                                                            { permissionName: CONFERENCE_MANAGE_GROUPS }
                                                            { permissionName: CONFERENCE_MANAGE_CONTENT }
                                                            { permissionName: CONFERENCE_MANAGE_SCHEDULE }
                                                            { permissionName: CONFERENCE_MANAGE_SHUFFLE }
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

        insert_permissions_Group(
            objects: [
                {
                    conferenceId: $conferenceId
                    enabled: false
                    name: "Registrants"
                    includeUnauthenticated: false
                    groupRoles: {
                        data: [
                            {
                                role: {
                                    data: {
                                        conferenceId: $conferenceId
                                        name: "Registrant"
                                        rolePermissions: {
                                            data: [
                                                { permissionName: CONFERENCE_VIEW }
                                                { permissionName: CONFERENCE_VIEW_ATTENDEES }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
                {
                    conferenceId: $conferenceId
                    enabled: false
                    name: "Public"
                    includeUnauthenticated: true
                    groupRoles: {
                        data: [
                            {
                                role: {
                                    data: {
                                        conferenceId: $conferenceId
                                        name: "Public"
                                        rolePermissions: { data: [{ permissionName: CONFERENCE_VIEW }] }
                                    }
                                }
                            }
                        ]
                    }
                }
                {
                    conferenceId: $conferenceId
                    enabled: false
                    name: "Registrars"
                    includeUnauthenticated: false
                    groupRoles: {
                        data: [
                            {
                                role: {
                                    data: {
                                        conferenceId: $conferenceId
                                        name: "Registrar"
                                        rolePermissions: {
                                            data: [
                                                { permissionName: CONFERENCE_MANAGE_ATTENDEES }
                                                { permissionName: CONFERENCE_VIEW_ATTENDEES }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
                {
                    conferenceId: $conferenceId
                    enabled: false
                    name: "Moderators"
                    includeUnauthenticated: false
                    groupRoles: {
                        data: [
                            {
                                role: {
                                    data: {
                                        conferenceId: $conferenceId
                                        name: "Moderator"
                                        rolePermissions: {
                                            data: [
                                                { permissionName: CONFERENCE_MODERATE_ATTENDEES }
                                                { permissionName: CONFERENCE_VIEW_ATTENDEES }
                                                { permissionName: CONFERENCE_VIEW }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
                {
                    conferenceId: $conferenceId
                    enabled: false
                    name: "Social Chairs"
                    includeUnauthenticated: false
                    groupRoles: {
                        data: [
                            {
                                role: {
                                    data: {
                                        conferenceId: $conferenceId
                                        name: "Social Chair"
                                        rolePermissions: { data: [{ permissionName: CONFERENCE_MANAGE_SHUFFLE }] }
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        ) {
            returning {
                id
                conferenceId
                name
                enabled
                groupRoles {
                    id
                    roleId
                    groupId
                    role {
                        id
                        name
                        conferenceId
                        rolePermissions {
                            id
                            roleId
                            permissionName
                        }
                    }
                }
            }
        }

        insert_content_Item(
            objects: {
                conferenceId: $conferenceId
                typeName: LANDING_PAGE
                elements: {
                    data: [
                        {
                            conferenceId: $conferenceId
                            typeName: ABSTRACT
                            data: $abstractData
                            isHidden: false
                            layoutData: null
                            name: "Welcome text"
                        }
                        {
                            conferenceId: $conferenceId
                            typeName: CONTENT_GROUP_LIST
                            data: $itemListData
                            isHidden: false
                            layoutData: null
                            name: "Content group list"
                        }
                    ]
                }
                shortTitle: "Landing"
                title: "Landing page"
            }
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
export function validateName(inValue: string | null | undefined): string | undefined {
    const intl = useIntl();
    let error;
    const value = inValue ? normaliseName(inValue) : undefined;
    if (!value || value.length === 0) {
        error = intl.formatMessage({ id: 'Conference.NewConferenceForm.NameRequired', defaultMessage: "Name is required" });
    } else if (value.length < 10) {
        error = intl.formatMessage({ id: 'Conference.NewConferenceForm.NameAtLeast', defaultMessage: "Name must be at least 10 characters." });
    }
    return error;
}

/**
 * Returns error message or undefined if no errors.
 */
export function validateShortName(inValue: string | null | undefined): string | undefined {
    const intl = useIntl();
    let error;
    const value = inValue ? normaliseName(inValue) : undefined;
    if (!value || value.length === 0) {
        error = intl.formatMessage({ id: 'Conference.NewConferenceForm.ShortNameRequired', defaultMessage: "Short name is required" });
    } else if (value.length < 5) {
        error = intl.formatMessage({ id: 'Conference.NewConferenceForm.ShortNameAtLeast', defaultMessage: "Short name must be at least 5 characters." });
    }
    return error;
}

export default function NewConferenceForm(): JSX.Element {
    const intl = useIntl();
    const toast = useToast();
    const apolloClient = useApolloClient();
    const history = useHistory();
    const { user } = useCurrentUser();

    const [createConferenceMutation] = useCreateConferenceMutation();
    const [createNewConferenceMetaStructureMutation] = useCreateNewConferenceMetaStructureMutation();

    function validateDemoCode(value: string | null | undefined) {
        if (!!value && isValidUUID(value)) {
            return undefined;
        } else {
            return intl.formatMessage({ id: 'Conference.NewConferenceForm.InvalidAccessCode', defaultMessage: "Not a valid access code." });
        }
    }

    function generateSlug(value: string) {
        return value.replace(/\s/g, "").toLowerCase();
    }

    const year = new Date().getFullYear();

    return (
        <Formik
            initialValues={{
                new_conf_name: intl.formatMessage({ id: 'Conference.NewConferenceForm.MyAwesomeConference', defaultMessage: "My Awesome Conference" }) + " " + year,
                new_conf_short_name: intl.formatMessage({ id: 'Conference.NewConferenceForm.MyAwesomeConferenceShort', defaultMessage: "MAC" }) + " " + year,
                new_conf_demo_code: "",
            }}
            onSubmit={async (_values, actions) => {
                const values = {
                    name: normaliseName(_values.new_conf_name),
                    shortName: normaliseName(_values.new_conf_short_name),
                    slug: generateSlug(normaliseName(_values.new_conf_short_name)),
                    demoCode: _values.new_conf_demo_code,
                };

                let failed: false | string = false;

                const takenResult = await apolloClient.query<ConferenceTakenQuery, ConferenceTakenQueryVariables>({
                    query: ConferenceTakenDocument,
                    variables: values,
                    fetchPolicy: "network-only",
                });
                try {
                    let ok: boolean | Pick<Conference_Conference, "id" | "name" | "shortName" | "slug"> = false;
                    if (takenResult.error) {
                        throw takenResult.error;
                    } else {
                        if (takenResult.data) {
                            if (takenResult.data.conference_Conference.length === 0) {
                                ok = true;
                            } else {
                                ok = takenResult.data.conference_Conference[0];
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
                            !result.data.insert_conference_Conference ||
                            !result.data.insert_conference_Conference.returning.length
                        ) {
                            toast({
                                title: intl.formatMessage({ id: 'Conference.NewConferenceForm.CouldNotCreateConference', defaultMessage: "Could not create conference" }),
                                description: intl.formatMessage({ id: 'Conference.NewConferenceForm.NameMaybeTaken', defaultMessage: "The name or short name may already be taken or your access code may have already been used." }),
                                status: "error",
                            });
                            // failed = true;
                        } else {
                            failed = false;
                            const conferenceId = result.data.insert_conference_Conference.returning[0].id;
                            const now = Date.now();

                            await createNewConferenceMetaStructureMutation({
                                variables: {
                                    conferenceId,
                                    registrantDisplayName: intl.formatMessage({ id: 'Conference.NewConferenceForm.ConferenceCreator', defaultMessage: "Conference Creator" }),
                                    userId: user.id,
                                    abstractData: [
                                        {
                                            createdAt: now,
                                            createdBy: "system",
                                            data: {
                                                type: "ABSTRACT",
                                                baseType: "text",
                                                text: intl.formatMessage({ id: 'Conference.NewConferenceForm.WelcomeToConference', defaultMessage: "Welcome to this conference!" }),
                                            },
                                        },
                                    ],
                                    itemListData: [
                                        {
                                            createdAt: now,
                                            createdBy: "system",
                                            data: { type: "CONTENT_GROUP_LIST", baseType: "component" },
                                        },
                                    ],
                                },
                            });

                            toast({
                                title: intl.formatMessage({ id: 'Conference.NewConferenceForm.ConferenceCreated', defaultMessage: "Conference created" }),
                                status: "success",
                            });
                            history.push(
                                `/conference/${result.data.insert_conference_Conference.returning[0].slug}/manage`
                            );
                        }
                    } else {
                        const errors: FormikErrors<{
                            new_conf_name: string;
                            new_conf_short_name: string;
                        }> = {};
                        if (ok.name === values.name) {
                            errors.new_conf_name = intl.formatMessage({ id: 'Conference.NewConferenceForm.NameTaken', defaultMessage: "Name has already been taken" });
                        }
                        if (ok.shortName === values.shortName) {
                            errors.new_conf_short_name = intl.formatMessage({ id: 'Conference.NewConferenceForm.ShortNameTaken', defaultMessage: "Short name has already been taken" });
                        }
                        if (ok.slug === values.slug) {
                            errors.new_conf_short_name = intl.formatMessage({ id: 'Conference.NewConferenceForm.ShortNameTaken', defaultMessage: "Short name has already been taken" });
                        }
                        actions.setErrors(errors);
                    }
                } catch (e) {
                    failed = e.toString();
                }

                if (failed) {
                    if (failed.includes("Check constraint violation. insert check constraint failed")) {
                        toast({
                            title: intl.formatMessage({ id: 'Conference.NewConferenceForm.FailedToCreateConference', defaultMessage: "Failed to create conference" }),
                            description: intl.formatMessage({ id: 'Conference.NewConferenceForm.AccessCodeAlreadyUsed', defaultMessage: "We were unable to create your conference as the access code has already been used." }),
                            status: "error",
                            duration: 7000,
                            isClosable: true,
                        });
                    } else {
                        toast({
                            title: intl.formatMessage({ id: 'Conference.NewConferenceForm.FailedToCreateConference', defaultMessage: "Failed to create conference" }),
                            description: intl.formatMessage({ id: 'Conference.NewConferenceForm.ErrorContactTechSupport', defaultMessage: "An error has occurred while trying to create your conference. Please contact our tech support to investigate the issue shown below." }),
                            status: "error",
                            duration: null,
                            isClosable: true,
                        });
                        toast({
                            title: intl.formatMessage({ id: 'Conference.NewConferenceForm.ErrorInformation', defaultMessage: "Error information" }),
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
                                isInvalid={!!form.errors.new_conf_name && !!form.touched.new_conf_name}
                                isRequired
                            >
                                <FormLabel htmlFor="new_conf_name">
                                    <FormattedMessage
                                        id="Conference.NewConferenceForm.Name"
                                        defaultMessage="Name"
                                    />
                                </FormLabel>
                                <Input
                                    {...{
                                        ...field,
                                        value: normaliseName(field.value, false),
                                    }}
                                    id="new_conf_name"
                                    placeholder="Name"
                                />
                                <FormErrorMessage>{form.errors.new_conf_name}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Field name="new_conf_short_name" validate={validateShortName}>
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={!!form.errors.new_conf_short_name && !!form.touched.new_conf_short_name}
                                isRequired
                                marginTop="1em"
                            >
                                <FormLabel htmlFor="new_conf_short_name">Short name</FormLabel>
                                <Input
                                    {...{
                                        ...field,
                                        value: normaliseName(field.value, false),
                                    }}
                                    id="new_conf_short_name"
                                    placeholder="Short name"
                                />
                                <FormErrorMessage>{form.errors.new_conf_short_name}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Field name="new_conf_demo_code" validate={validateDemoCode}>
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={!!form.errors.new_conf_demo_code && !!form.touched.new_conf_demo_code}
                                isRequired
                                marginTop="1em"
                            >
                                <FormLabel htmlFor="new_conf_demo_code">
                                    <FormattedMessage
                                        id="Conference.NewConferenceForm.AccessCode"
                                        defaultMessage="Access code"
                                    />
                                </FormLabel>
                                <InputGroup>
                                    <Input {...field} id="new_conf_demo_code" placeholder={intl.formatMessage({ id: 'Conference.NewConferenceForm.DemoCode', defaultMessage: "Demo code" })} />
                                    <InputRightAddon>
                                        <Tooltip label={intl.formatMessage({ id: 'Conference.NewConferenceForm.PleaseContactUs', defaultMessage: "To create a conference, please contact us at to receive your access code." })}>
                                            {intl.formatMessage({ id: 'Conference.NewConferenceForm.WhatsThis', defaultMessage: "What's this?" })}
                                        </Tooltip>
                                    </InputRightAddon>
                                </InputGroup>
                                <FormErrorMessage>{form.errors.new_conf_demo_code}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Button
                        mt={4}
                        colorScheme="PrimaryActionButton"
                        isLoading={props.isSubmitting}
                        type="submit"
                        isDisabled={!props.isValid}
                    >
                        <FormattedMessage
                            id="Conference.NewConferenceForm.Create"
                            defaultMessage="Create"
                        />
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
