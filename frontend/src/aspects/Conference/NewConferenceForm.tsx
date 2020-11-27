import { gql, useApolloClient } from "@apollo/client";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
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
} from "../../generated/graphql";

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
    ) {
        insert_Conference(
            objects: [{ name: $name, shortName: $shortName, slug: $slug }]
        ) {
            returning {
                id
                slug
            }
        }
    }
`;

export default function NewConferenceForm(): JSX.Element {
    const toast = useToast();
    const apolloClient = useApolloClient();
    const history = useHistory();

    const [createConferenceMutation] = useCreateConferenceMutation();

    function normaliseName(value: string, trim = true) {
        let result = value?.replace(/\s\s+/g, " ");
        if (trim) {
            result = result?.trim();
        }
        return result;
    }

    function validateName(inValue: string | null | undefined) {
        let error;
        const value = inValue ? normaliseName(inValue) : undefined;
        if (!value || value.length === 0) {
            error = "Name is required";
        } else if (value.length < 10) {
            error = "Name must be at least 10 characters.";
        }
        return error;
    }

    function validateShortName(inValue: string | null | undefined) {
        let error;
        const value = inValue ? normaliseName(inValue) : undefined;
        if (!value || value.length === 0) {
            error = "Short name is required";
        } else if (value.length < 5) {
            error = "Short name must be at least 5 characters.";
        }
        return error;
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
            }}
            onSubmit={async (_values, actions) => {
                const values = {
                    name: normaliseName(_values.new_conf_name),
                    shortName: normaliseName(_values.new_conf_short_name),
                    slug: generateSlug(
                        normaliseName(_values.new_conf_short_name)
                    ),
                };

                let failed = false;

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
                            ok = false;
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
                            failed = true;
                        } else {
                            failed = false;
                            toast({
                                title: "Conference created",
                                status: "success",
                            });
                            history.push(
                                `/conference/${result.data.insert_Conference.returning[0].slug}/manage`
                            );
                        }
                    } else if (ok === false) {
                        failed = true;
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
                    failed = true;
                }

                if (failed) {
                    toast({
                        title: "Failed to create conference",
                        description:
                            "An error has occurred while trying to create your conference. Please try again later or contact our tech support.",
                        status: "error",
                    });
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
