import { Button, FormControl, FormErrorMessage, FormLabel, Select, useToast } from "@chakra-ui/react";
import { VonageSessionLayoutData, VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import type { EventParticipantStreamDetailsFragment } from "../../../../../generated/graphql";

export function SingleLayoutForm({
    setLayout,
    streams,
}: {
    setLayout: (layoutData: VonageSessionLayoutData) => Promise<void>;
    streams: readonly EventParticipantStreamDetailsFragment[];
}): JSX.Element {
    const toast = useToast();
    return (
        <Formik<{ stream_id: string }>
            initialValues={{
                stream_id: "",
            }}
            onSubmit={async (values) => {
                const layoutData: VonageSessionLayoutData = {
                    type: VonageSessionLayoutType.Single,
                    focusStreamId: values.stream_id,
                };

                try {
                    await setLayout(layoutData);
                } catch (e) {
                    console.error("Failed to set broadcast layout", e);
                    toast({
                        title: "Failed to set broadcast layout",
                        status: "error",
                    });
                }
            }}
        >
            {(props) => (
                <Form>
                    <Field name="stream_id">
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={!!form.errors.stream_id && !!form.touched.stream_id}
                                isRequired
                                defaultValue=""
                            >
                                <FormLabel htmlFor="stream_id">Stream</FormLabel>
                                <Select {...{ ...field }} placeholder="Choose a stream" isRequired>
                                    {streams.map((stream) => (
                                        <option key={stream.id} value={stream.vonageStreamId}>
                                            {stream.attendee.displayName} ({stream.vonageStreamType})
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{form.errors.stream_id}</FormErrorMessage>
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
                        Use fullscreen layout
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
