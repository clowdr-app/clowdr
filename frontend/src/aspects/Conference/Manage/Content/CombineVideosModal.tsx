import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react";
import { FieldArray, Form, Formik } from "formik";
import React, { useMemo } from "react";
import Select from "react-select";
import { ContentType_Enum } from "../../../../generated/graphql";
import type { ContentGroupDescriptor } from "./Types";

export function CombineVideosModal({
    isOpen,
    onClose,
    allGroupsMap,
    contentGroupId,
}: {
    isOpen: boolean;
    onClose: () => void;
    allGroupsMap?: Map<string, ContentGroupDescriptor>;
    contentGroupId: string;
}): JSX.Element {
    const contentGroup = useMemo(() => allGroupsMap?.get(contentGroupId), [allGroupsMap, contentGroupId]);

    const options = useMemo(
        () =>
            contentGroup?.items
                .filter((item) =>
                    [
                        ContentType_Enum.VideoFile,
                        ContentType_Enum.VideoBroadcast,
                        ContentType_Enum.VideoPrepublish,
                    ].includes(item.typeName)
                )
                .map((item) => ({
                    label: item.name,
                    value: item.id,
                })) ?? [],
        [contentGroup?.items]
    );

    return (
        <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
            <Formik
                initialValues={{ contentItemIds: [] }}
                onSubmit={(values, actions) => {
                    console.log(values.contentItemIds);
                    actions.setSubmitting(false);
                }}
            >
                {({ dirty, ...props }) => (
                    <Form>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>Combine Videos</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Box>
                                    <FieldArray name="contentItemIds">
                                        {({ form, name }) => (
                                            <FormControl
                                                isInvalid={!!form.errors.contentItemIds && !form.touched.contentItemIds}
                                                isRequired
                                            >
                                                <FormLabel htmlFor="contentItemIds">Videos</FormLabel>
                                                <Select
                                                    options={options}
                                                    isMulti={true}
                                                    onChange={(options) =>
                                                        form.setFieldValue(name, options?.map((o) => o.value) ?? [])
                                                    }
                                                    styles={{
                                                        container: (provided: any, _state: any) => ({
                                                            ...provided,
                                                            width: "100%",
                                                            backgroundColor: "#322659",
                                                            color: "white",
                                                        }),
                                                        control: (provided: any, _state: any) => ({
                                                            ...provided,
                                                            backgroundColor: "inherit",
                                                            color: "inherit",
                                                        }),
                                                        menu: (provided: any, _state: any) => ({
                                                            ...provided,
                                                            backgroundColor: "inherit",
                                                            color: "inherit",
                                                        }),
                                                        menuList: (provided: any, _state: any) => ({
                                                            ...provided,
                                                            maxHeight: "300px",
                                                            scrollBehavior: "smooth",
                                                        }),
                                                        multiValue: (provided: any, _state: any) => ({
                                                            ...provided,
                                                            backgroundColor: "#f0edf7",
                                                            color: "black",
                                                        }),
                                                        singleValue: (provided: any, _state: any) => ({
                                                            ...provided,
                                                            color: "white",
                                                        }),
                                                        multiValueLabel: (provided: any, _state: any) => ({
                                                            ...provided,
                                                            color: "black",
                                                        }),
                                                        option: (
                                                            styles: any,
                                                            { isDisabled, isFocused, isSelected }: any
                                                        ) => {
                                                            return {
                                                                ...styles,
                                                                backgroundColor: isDisabled
                                                                    ? null
                                                                    : isSelected
                                                                    ? "#322659"
                                                                    : isFocused
                                                                    ? "#47367d"
                                                                    : null,
                                                                color: isDisabled ? "#ccc" : "white",
                                                                cursor: isDisabled ? "not-allowed" : "default",

                                                                ":active": {
                                                                    ...styles[":active"],
                                                                    backgroundColor:
                                                                        !isDisabled &&
                                                                        (isSelected ? "#47367d" : "#47367d"),
                                                                },
                                                            };
                                                        },
                                                    }}
                                                />
                                                <FormHelperText>Videos to be combined into a new file.</FormHelperText>
                                                <FormErrorMessage>{form.errors.contentItemIds}</FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </FieldArray>
                                </Box>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    colorScheme="green"
                                    isLoading={props.isSubmitting}
                                    type="submit"
                                    isDisabled={!props.isValid || !dirty}
                                    mr={3}
                                >
                                    Create combined video
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
