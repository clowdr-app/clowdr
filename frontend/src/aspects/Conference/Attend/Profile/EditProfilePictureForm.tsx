import { gql } from "@apollo/client";
import { Box, Button, Flex, FormControl, FormHelperText, Image, Text, useToast } from "@chakra-ui/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import { DragDrop, StatusBar } from "@uppy/react";
import "@uppy/status-bar/dist/style.css";
import { Form, Formik } from "formik";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSubmitProfilePhotoMutation } from "../../../../generated/graphql";
import FAIcon from "../../../Icons/FAIcon";
import UnsavedChangesWarning from "../../../LeavingPageWarnings/UnsavedChangesWarning";
import type { AttendeeContextT } from "../../useCurrentAttendee";

gql`
    mutation SubmitProfilePhoto($attendeeId: uuid!, $s3URL: String!) {
        updateProfilePhoto(attendeeId: $attendeeId, s3URL: $s3URL) {
            ok
        }
    }
`;

export default function EditProfilePitureForm({
    handleFormSubmitted,
    attendee,
}: {
    handleFormSubmitted?: () => Promise<void>;
    attendee: AttendeeContextT;
}): JSX.Element {
    const toast = useToast();
    const [files, setFiles] = useState<Uppy.UppyFile[]>([]);
    const [submitProfilePhoto] = useSubmitProfilePhotoMutation();
    const allowedFileTypes = useMemo(() => ["image/*", ".jpg", ".jpeg", ".png", ".gif", ".webp"], []);
    const uppy = useMemo(() => {
        const uppy = Uppy<Uppy.StrictTypes>({
            id: "profile-photo-upload",
            meta: {
                attendeeId: attendee.id,
            },
            allowMultipleUploads: false,
            restrictions: {
                allowedFileTypes,
                maxNumberOfFiles: 1,
                minNumberOfFiles: 1,
                maxFileSize: 1024 * 1024,
            },
            autoProceed: false,
        });

        uppy?.use(AwsS3Multipart, {
            limit: 4,
            companionUrl: import.meta.env.SNOWPACK_PUBLIC_COMPANION_BASE_URL,
        });
        return uppy;
    }, [allowedFileTypes, attendee.id]);

    const updateFiles = useCallback(() => {
        const validNameRegex = /^[a-zA-Z0-9.!*'()\-_ ]+$/;
        if (uppy) {
            const invalidFiles = uppy?.getFiles().filter((file) => !validNameRegex.test(file.name));
            for (const invalidFile of invalidFiles) {
                toast({
                    position: "top",
                    status: "error",
                    description:
                        "Invalid file name. File names must only contain letters, numbers, spaces and the following special characters: !*'()-_",
                });
                uppy.removeFile(invalidFile.id);
            }

            setFiles(uppy.getFiles());
        }
    }, [toast, uppy]);

    useEffect(() => {
        uppy?.on("file-added", updateFiles);
        uppy?.on("file-removed", updateFiles);
    }, [attendee, toast, updateFiles, uppy]);

    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    return (
        <>
            <Formik
                initialValues={{}}
                onSubmit={async (_values) => {
                    if (!uppy) {
                        throw new Error("No Uppy instance");
                    }
                    let result;
                    try {
                        result = await uppy.upload();
                    } catch (e) {
                        console.error("Failed to upload file", e);
                        toast({
                            position: "top",
                            status: "error",
                            description: "Failed to upload file. Please try again.",
                        });
                        uppy.reset();
                        return;
                    }

                    if (result.failed.length > 0 || result.successful.length < 1) {
                        console.error("Failed to upload file", result.failed);
                        toast({
                            position: "top",
                            status: "error",
                            description: "Failed to upload file. Please try again later.",
                        });
                        uppy.reset();
                        return;
                    }

                    try {
                        const submitResult = await submitProfilePhoto({
                            variables: {
                                s3URL: result.successful[0].uploadURL,
                                attendeeId: attendee.id,
                            },
                        });

                        if (submitResult.errors || !submitResult.data?.updateProfilePhoto?.ok) {
                            throw new Error("Upload failed.");
                        }

                        await new Promise<void>((resolve) =>
                            setTimeout(async () => {
                                await attendee.refetch();
                                resolve();
                            }, 1500)
                        );

                        toast({
                            position: "top",
                            status: "success",
                            description: "Uploaded file successfully.",
                        });

                        uppy.reset();

                        if (handleFormSubmitted) {
                            await handleFormSubmitted();
                        }
                    } catch (e) {
                        console.error("Failed to upload file", e);
                        toast({
                            status: "error",
                            title: "Failed to upload file.",
                            description: e?.message ?? "Please try again later.",
                        });
                        uppy.reset();
                        return;
                    }
                }}
            >
                {({ dirty, ...props }) => (
                    <>
                        <UnsavedChangesWarning hasUnsavedChanges={dirty || files.length > 0} />
                        <Form style={{ width: "100%", maxWidth: "350px" }}>
                            <FormControl isInvalid={!files} isRequired color="white">
                                <Box
                                    pos="relative"
                                    w={350}
                                    h={350}
                                    borderWidth={2}
                                    borderColor="gray.400"
                                    borderRadius={10}
                                    mt={2}
                                    mb={2}
                                    p={0}
                                    overflow="hidden"
                                >
                                    {files.length === 1 || attendee.profile.photoURL_350x350 ? (
                                        <Image
                                            mt={2}
                                            alt={
                                                files.length === 1
                                                    ? "Preview of the selected file."
                                                    : "Your current profile picture."
                                            }
                                            src={
                                                (files.length === 1
                                                    ? URL.createObjectURL(files[0].data)
                                                    : attendee.profile.photoURL_350x350) as string
                                            }
                                            objectFit="cover"
                                            w="100%"
                                            h="100%"
                                            pos="absolute"
                                            top={0}
                                            left={0}
                                            m={0}
                                            p={0}
                                            filter="brightness(25%)"
                                        />
                                    ) : undefined}
                                    <Flex
                                        w="100%"
                                        h="100%"
                                        pos="absolute"
                                        justifyContent={files.length === 1 ? "center" : "flex-start"}
                                        alignItems="center"
                                        flexDir="column"
                                        p={5}
                                    >
                                        <Text
                                            as="span"
                                            mt={files.length === 1 ? 0 : 10}
                                            fontWeight="bold"
                                            fontSize="1.5em"
                                            textAlign="center"
                                        >
                                            {files.length === 1
                                                ? "Please press Upload when you're ready"
                                                : !attendee.profile.photoURL_350x350
                                                ? "Please upload a picture."
                                                : undefined}
                                        </Text>
                                    </Flex>
                                    <Box display={files.length === 1 ? "none" : ""}>
                                        <DragDrop
                                            width={350}
                                            height={350}
                                            uppy={uppy as Uppy.Uppy}
                                            allowMultipleFiles={false}
                                        />
                                    </Box>
                                    {attendee.profile.photoURL_350x350 ? (
                                        <Button
                                            isLoading={isDeleting}
                                            pos="absolute"
                                            aria-label="Remove profile picture"
                                            colorScheme="red"
                                            top={2}
                                            right={2}
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                setIsDeleting(true);

                                                (async () => {
                                                    try {
                                                        await submitProfilePhoto({
                                                            variables: {
                                                                s3URL: "",
                                                                attendeeId: attendee.id,
                                                            },
                                                        });
                                                        await attendee.refetch();
                                                    } finally {
                                                        setIsDeleting(false);
                                                    }
                                                })();
                                            }}
                                        >
                                            <FAIcon iconStyle="s" icon="trash-alt" />
                                        </Button>
                                    ) : undefined}
                                </Box>
                                <FormHelperText>
                                    File types: {allowedFileTypes.join(", ")}.<br />
                                    Maximum file size 1MiB.
                                </FormHelperText>
                            </FormControl>

                            <StatusBar uppy={uppy as Uppy.Uppy} hideAfterFinish hideUploadButton />
                            <Button
                                colorScheme="green"
                                isLoading={props.isSubmitting}
                                type="submit"
                                isDisabled={!props.isValid || files.length !== 1}
                                mt={2}
                            >
                                Upload
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </>
    );
}
