import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Center,
    FormControl,
    FormHelperText,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Text,
    useToast,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useInsertSubmissionRequestEmailJobsMutation } from "../../../../generated/graphql";
import CRUDTable, { CRUDTableProps, defaultStringFilter, FieldType, UpdateResult } from "../../../CRUDTable/CRUDTable";
import isValidUUID from "../../../Utils/isValidUUID";
import type { RequiredContentItemDescriptor, UploaderDescriptor } from "./Types";

const UploaderCRUDTable = (props: Readonly<CRUDTableProps<UploaderDescriptor, "id">>) => CRUDTable(props);

gql`
    mutation InsertSubmissionRequestEmailJobs($objs: [job_queues_SubmissionRequestEmailJob_insert_input!]!) {
        insert_job_queues_SubmissionRequestEmailJob(objects: $objs) {
            affected_rows
        }
    }
`;

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    groupTitle: string;
    isItemDirty: boolean;
    itemDesc: RequiredContentItemDescriptor;
    setUploadsRemaining: (newUploadsRemaining: number | null) => void;
    insertUploader: (uploader: UploaderDescriptor) => void;
    updateUploader: (uploader: UploaderDescriptor) => void;
    deleteUploader: (uploaderId: string) => void;
}

export default function UploadersModal({
    isOpen,
    onOpen,
    onClose,
    groupTitle,
    itemDesc,
    isItemDirty,
    setUploadsRemaining,
    insertUploader,
    updateUploader,
    deleteUploader,
}: Props): JSX.Element {
    const uploadersMap = useMemo(() => {
        const results = new Map<string, UploaderDescriptor>();

        itemDesc.uploaders.forEach((uploader) => {
            results.set(uploader.id, uploader);
        });

        return results;
    }, [itemDesc.uploaders]);

    const [sendSubmissionRequests, { loading: sendingRequestsLoading }] = useInsertSubmissionRequestEmailJobsMutation();
    const toast = useToast();

    return (
        <>
            <Box mt={4}>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme="blue">
                        Manage uploaders
                    </Button>
                    <Text mt={2} as="p">
                        (Uploaders are the people who may upload content to this item.)
                    </Text>
                </Center>
            </Box>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Uploaders</ModalHeader>
                    <ModalHeader paddingBottom={0} paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic">
                        {itemDesc.name}
                    </ModalHeader>
                    <ModalHeader paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic" fontWeight="normal">
                        &ldquo;{groupTitle}&bdquo;
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <FormControl maxW={300} pb={10}>
                                <FormLabel>Submission attempts remaining</FormLabel>
                                <NumberInput
                                    precision={0}
                                    value={itemDesc.uploadsRemaining ?? ""}
                                    onChange={(value) =>
                                        setUploadsRemaining(value.length === 0 ? null : parseInt(value, 10))
                                    }
                                    maxWidth="100%"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <FormHelperText>
                                    Number of repeat submissions allowed for this item. Leave blank to allow unlimited.
                                    Recommended value: 3.
                                </FormHelperText>
                            </FormControl>
                            {isItemDirty ? (
                                <Alert status="info" mb={2}>
                                    <AlertIcon />
                                    <AlertTitle mr={2}>Unsaved changes</AlertTitle>
                                    <AlertDescription>
                                        To be able to send email notifications, please save all your changes.
                                    </AlertDescription>
                                </Alert>
                            ) : undefined}
                            <UploaderCRUDTable
                                data={uploadersMap}
                                externalUnsavedChanges={isItemDirty}
                                primaryFields={{
                                    keyField: {
                                        heading: "Id",
                                        ariaLabel: "Unique identifier",
                                        description: "Unique identifier",
                                        isHidden: true,
                                        insert: (item, v) => {
                                            return {
                                                ...item,
                                                id: v,
                                            };
                                        },
                                        extract: (v) => v.id,
                                        spec: {
                                            fieldType: FieldType.string,
                                            convertToUI: (x) => x,
                                            disallowSpaces: true,
                                        },
                                        validate: (v) => isValidUUID(v) || ["Invalid UUID"],
                                        getRowTitle: (v) => v.name,
                                    },
                                    otherFields: {
                                        name: {
                                            heading: "Name",
                                            ariaLabel: "Name",
                                            description: "Name",
                                            isHidden: false,
                                            isEditable: true,
                                            defaultValue: "Jenny Smith",
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    name: v,
                                                };
                                            },
                                            extract: (v) => v.name,
                                            spec: {
                                                fieldType: FieldType.string,
                                                convertFromUI: (x) => x,
                                                convertToUI: (x) => x,
                                                filter: defaultStringFilter,
                                            },
                                            validate: (v) => v.length >= 3 || ["Name must be at least 3 characters"],
                                        },
                                        email: {
                                            heading: "Email",
                                            ariaLabel: "Email",
                                            description:
                                                "The email address this person's submission request should be sent to.",
                                            isHidden: false,
                                            isEditableAtCreate: true,
                                            isEditable: false,
                                            defaultValue: "",
                                            insert: (item, v) => {
                                                return {
                                                    ...item,
                                                    email: v,
                                                };
                                            },
                                            extract: (v) => v.email,
                                            spec: {
                                                fieldType: FieldType.string,
                                                convertFromUI: (x) => x,
                                                convertToUI: (x) => x,
                                                filter: defaultStringFilter,
                                            },
                                            validate: (_v) => true, // TODO: Validation
                                        },
                                        emailsSent: {
                                            heading: "Requests sent",
                                            ariaLabel: "Number of requests sent",
                                            description: "Number of submission requests this uploader has been sent.",
                                            isHidden: false,
                                            isEditableAtCreate: false,
                                            isEditable: false,
                                            extract: (v) => v.emailsSentCount,
                                            spec: {
                                                fieldType: FieldType.integer,
                                                convertToUI: (x) => x.toString(),
                                            },
                                        },
                                    },
                                }}
                                csud={{
                                    cudCallbacks: {
                                        create: async (
                                            partialUploader: Partial<UploaderDescriptor>
                                        ): Promise<string | null> => {
                                            assert(partialUploader.email);
                                            assert(partialUploader.name);
                                            const newUploader: UploaderDescriptor = {
                                                email: partialUploader.email,
                                                emailsSentCount: 0,
                                                id: uuidv4(),
                                                name: partialUploader.name,
                                                requiredContentItemId: itemDesc.id,
                                                isNew: true,
                                            };
                                            insertUploader(newUploader);
                                            return newUploader.id;
                                        },
                                        update: async (uploaders): Promise<Map<string, UpdateResult>> => {
                                            const results = new Map<string, UpdateResult>();
                                            for (const [key, uploader] of uploaders) {
                                                results.set(key, true);
                                                updateUploader(uploader);
                                            }
                                            return results;
                                        },
                                        delete: async (keys): Promise<Map<string, boolean>> => {
                                            const results = new Map<string, boolean>();
                                            for (const key of keys) {
                                                results.set(key, true);
                                                deleteUploader(key);
                                            }
                                            return results;
                                        },
                                    },
                                }}
                                customButtons={
                                    isItemDirty
                                        ? []
                                        : [
                                              {
                                                  action: async (uploaderIds) => {
                                                      await sendSubmissionRequests({
                                                          variables: {
                                                              objs: Array.from(uploaderIds.values()).map(
                                                                  (uploaderId) => ({
                                                                      uploaderId,
                                                                  })
                                                              ),
                                                          },
                                                      });
                                                      toast({
                                                          title: "Requests sent",
                                                          duration: 3000,
                                                          isClosable: true,
                                                          status: "success",
                                                      });
                                                  },
                                                  enabledWhenNothingSelected: false,
                                                  enabledWhenDirty: false,
                                                  tooltipWhenDisabled:
                                                      "Save your changes to enable sending submission requests",
                                                  tooltipWhenEnabled: "Sends submission requests to selected uploaders",
                                                  colorScheme: "red",
                                                  isRunning: sendingRequestsLoading,
                                                  label: "Send submission requests",
                                                  text: "Send submission requests",
                                              },
                                          ]
                                }
                            />
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                            Done
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
