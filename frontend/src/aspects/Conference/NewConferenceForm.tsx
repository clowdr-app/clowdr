import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";

export default function NewConferenceForm(): JSX.Element {
    function normaliseName(value: string | null | undefined, trim = true) {
        let result = value?.replace(/\s\s+/g, " ");
        if (trim) {
            result = result?.trim();
        }
        return result;
    }

    function validateName(inValue: string | null | undefined) {
        let error;
        const value = normaliseName(inValue);
        if (!value || value.length === 0) {
            error = "Name is required";
        } else if (value.length < 10) {
            error = "Name must be at least 10 characters.";
        }
        return error;
    }

    function validateShortName(inValue: string | null | undefined) {
        let error;
        const value = normaliseName(inValue);
        if (!value || value.length === 0) {
            error = "Short name is required";
        } else if (value.length < 5) {
            error = "Short name must be at least 5 characters.";
        }
        return error;
    }

    const year = new Date().getFullYear();

    return (
        <Formik
            initialValues={{
                new_conf_name: "My Awesome Conference " + year,
                new_conf_short_name: "MAC " + year,
            }}
            onSubmit={(values, actions) => {
                setTimeout(() => {
                    alert(JSON.stringify(values, null, 2));
                    actions.setSubmitting(false);
                }, 1000);
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
