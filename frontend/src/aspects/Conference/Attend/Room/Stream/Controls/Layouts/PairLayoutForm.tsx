import { Button, FormControl, FormErrorMessage, FormLabel, Select, useToast } from "@chakra-ui/react";
import { VonageSessionLayoutData, VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import type { VonageParticipantStreamDetailsFragment } from "../../../../../../../generated/graphql";

export function PairLayoutForm({
    setLayout,
    streams,
}: {
    setLayout: (layoutData: VonageSessionLayoutData) => Promise<void>;
    streams: readonly VonageParticipantStreamDetailsFragment[];
}): JSX.Element {
    const toast = useToast();
    return (
        <Formik<{ left_stream_id: string; right_stream_id: string }>
            initialValues={{
                left_stream_id: "",
                right_stream_id: "",
            }}
            onSubmit={async (values) => {
                const layoutData: VonageSessionLayoutData = {
                    type: VonageSessionLayoutType.Pair,
                    leftStreamId: values.left_stream_id,
                    rightStreamId: values.right_stream_id,
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
                    <Field name="left_stream_id">
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={!!form.errors.left_stream_id && !!form.touched.left_stream_id}
                                defaultValue=""
                                isRequired
                            >
                                <FormLabel htmlFor="left_stream_id">Left Panel</FormLabel>
                                <Select {...{ ...field }} placeholder="Choose a stream" isRequired>
                                    {streams.map((stream) => (
                                        <option key={stream.id} value={stream.vonageStreamId}>
                                            {stream.registrant.displayName} ({stream.vonageStreamType})
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{form.errors.left_stream_id}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Field name="right_stream_id">
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={!!form.errors.right_stream_id && !!form.touched.right_stream_id}
                                defaultValue=""
                                isRequired
                            >
                                <FormLabel htmlFor="right_stream_id">Right Panel</FormLabel>
                                <Select {...{ ...field }} placeholder="Choose a stream" isRequired>
                                    {streams.map((stream) => (
                                        <option key={stream.id} value={stream.vonageStreamId}>
                                            {stream.registrant.displayName} ({stream.vonageStreamType})
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{form.errors.right_stream_id}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Button
                        mt={4}
                        colorScheme="purple"
                        isLoading={props.isSubmitting}
                        type="submit"
                        isDisabled={!props.isValid}
                        aria-label="Set layout to side-by-side mode"
                    >
                        Set layout
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
