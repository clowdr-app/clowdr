import { gql } from "@apollo/client";
import {
    Badge,
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    useToast,
} from "@chakra-ui/react";
import type { CombineVideosJobDataBlob, InputContentItem } from "@clowdr-app/shared-types/build/combineVideosJob";
import { FieldArray, Form, Formik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
    ContentType_Enum,
    JobStatus_Enum,
    useCombineVideosModal_CreateCombineVideosJobMutation,
    useCombineVideosModal_GetCombineVideosJobQuery,
} from "../../../../generated/graphql";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { useConference } from "../../useConference";
import type { ContentGroupDescriptor } from "./Types";

gql`
    mutation CombineVideosModal_CreateCombineVideosJob(
        $conferenceId: uuid!
        $createdByAttendeeId: uuid!
        $data: jsonb!
    ) {
        insert_job_queues_CombineVideosJob_one(
            object: { conferenceId: $conferenceId, createdByAttendeeId: $createdByAttendeeId, data: $data }
        ) {
            id
        }
    }

    query CombineVideosModal_GetCombineVideosJob($id: uuid!) {
        job_queues_CombineVideosJob_by_pk(id: $id) {
            id
            message
            jobStatusName
        }
    }
`;

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
                    label: item.isHidden ? `[HIDDEN] ${item.name}` : item.name,
                    value: item.id,
                })) ?? [],
        [contentGroup?.items]
    );

    const toast = useToast();
    const conference = useConference();
    const user = useCurrentUser();

    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const { data, startPolling, stopPolling } = useCombineVideosModal_GetCombineVideosJobQuery({
        ...(currentJobId
            ? {
                  variables: {
                      id: currentJobId,
                  },
              }
            : {}),
    });
    useEffect(() => {
        if (currentJobId) {
            startPolling(10000);
        } else {
            stopPolling();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentJobId]);

    const [mutate] = useCombineVideosModal_CreateCombineVideosJobMutation();

    return (
        <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
            <Formik
                initialValues={{ contentItemIds: [] }}
                onSubmit={async (values, actions) => {
                    console.log(values.contentItemIds);
                    const items: InputContentItem[] = values.contentItemIds.map((id) => ({
                        contentItemId: id,
                        includeSubtitles: false,
                    }));
                    const data: CombineVideosJobDataBlob = {
                        inputContentItems: items,
                    };

                    try {
                        const result = await mutate({
                            variables: {
                                conferenceId: conference.id,
                                createdByAttendeeId: user.user.attendees[0].id,
                                data,
                            },
                        });

                        if (!result.data?.insert_job_queues_CombineVideosJob_one) {
                            throw new Error("Failed to create CombineVideosJob");
                        }

                        setCurrentJobId(result.data.insert_job_queues_CombineVideosJob_one.id);
                    } catch (e) {
                        console.error("Failed to submit CombineVideosJob", e);
                        toast({
                            status: "error",
                            title: "Failed to submit job",
                            description: e.message,
                        });
                    } finally {
                        actions.setSubmitting(false);
                    }
                }}
            >
                {({ dirty, isSubmitting, isValid }) => (
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
                                    {data ? (
                                        <Box
                                            borderRadius="md"
                                            border="1px solid white"
                                            mt={4}
                                            p={2}
                                            w="auto"
                                            display="inline-block"
                                        >
                                            <Heading as="h4" fontSize="sm">
                                                Ongoing job
                                            </Heading>
                                            <Badge colorScheme="green">
                                                {data?.job_queues_CombineVideosJob_by_pk?.jobStatusName}
                                            </Badge>
                                            {data.job_queues_CombineVideosJob_by_pk?.jobStatusName ===
                                            JobStatus_Enum.InProgress ? (
                                                <Spinner size="sm" ml={2} mt={1} />
                                            ) : undefined}
                                            {data?.job_queues_CombineVideosJob_by_pk?.message ? (
                                                <Text>Message: {data?.job_queues_CombineVideosJob_by_pk?.message}</Text>
                                            ) : undefined}
                                        </Box>
                                    ) : undefined}
                                </Box>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    colorScheme="green"
                                    isLoading={isSubmitting}
                                    type="submit"
                                    isDisabled={!isValid || !dirty}
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
