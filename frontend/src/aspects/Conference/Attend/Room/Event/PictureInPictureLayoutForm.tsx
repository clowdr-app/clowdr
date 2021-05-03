import { Button, FormControl, FormErrorMessage, FormLabel, Select, useToast } from "@chakra-ui/react";
import { VonageSessionLayoutData, VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import type { EventParticipantStreamDetailsFragment } from "../../../../../generated/graphql";

export function PictureInPictureLayoutForm({
    setLayout,
    streams,
}: {
    setLayout: (layoutData: VonageSessionLayoutData) => Promise<void>;
    streams: readonly EventParticipantStreamDetailsFragment[];
}): JSX.Element {
    const toast = useToast();
    return (
        <Formik<{ focus_stream_id: string; corner_stream_id: string }>
            initialValues={{
                focus_stream_id: "",
                corner_stream_id: "",
            }}
            onSubmit={async (values) => {
                const layoutData: VonageSessionLayoutData = {
                    type: VonageSessionLayoutType.PictureInPicture,
                    focusStreamId: values.focus_stream_id,
                    cornerStreamId: values.corner_stream_id,
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
                    <Field name="focus_stream_id">
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={!!form.errors.focus_stream_id && !!form.touched.focus_stream_id}
                                defaultValue=""
                                isRequired
                            >
                                <FormLabel htmlFor="focus_stream_id">Fullscreen Panel</FormLabel>
                                <Select {...{ ...field }} placeholder="Choose a stream" isRequired>
                                    {streams.map((stream) => (
                                        <option key={stream.id} value={stream.vonageStreamId}>
                                            {stream.registrant.displayName} ({stream.vonageStreamType})
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{form.errors.focus_stream_id}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Field name="corner_stream_id">
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl
                                isInvalid={!!form.errors.corner_stream_id && !!form.touched.corner_stream_id}
                                defaultValue=""
                                isRequired
                            >
                                <FormLabel htmlFor="corner_stream_id">Inset Panel</FormLabel>
                                <Select {...{ ...field }} placeholder="Choose a stream" isRequired>
                                    {streams.map((stream) => (
                                        <option key={stream.id} value={stream.vonageStreamId}>
                                            {stream.registrant.displayName} ({stream.vonageStreamType})
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{form.errors.corner_stream_id}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>
                    <Button
                        mt={4}
                        colorScheme="green"
                        isLoading={props.isSubmitting}
                        type="submit"
                        isDisabled={!props.isValid}
                        aria-label="Set layout to picture-in-picture mode"
                    >
                        Set layout
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
