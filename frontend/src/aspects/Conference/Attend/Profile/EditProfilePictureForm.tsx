import { gql } from "@apollo/client";
import { Box, Button, Flex, FormControl, FormHelperText, Image, Text, useToast } from "@chakra-ui/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import type { UppyFile } from "@uppy/core";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import { DragDrop, StatusBar } from "@uppy/react";
import "@uppy/status-bar/dist/style.css";
import { Form, Formik } from "formik";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfileDataFragment } from "../../../../generated/graphql";
import { ProfileDataFragmentDoc, useSubmitProfilePhotoMutation } from "../../../../generated/graphql";
import FAIcon from "../../../Icons/FAIcon";
import UnsavedChangesWarning from "../../../LeavingPageWarnings/UnsavedChangesWarning";
import type { RegistrantContextT } from "../../useCurrentRegistrant";
import { FormattedMessage, useIntl } from "react-intl";

gql`
    mutation SubmitProfilePhoto($registrantId: uuid!, $s3URL: String!) {
        updateProfilePhoto(registrantId: $registrantId, s3URL: $s3URL) {
            ok
            photoURL_350x350
            photoURL_50x50
        }
    }
`;

export default function EditProfilePitureForm({
    handleFormSubmitted,
    registrant,
}: {
    handleFormSubmitted?: () => Promise<void>;
    registrant: RegistrantContextT;
}): JSX.Element {
    const intl = useIntl();
    const toast = useToast();
    const [files, setFiles] = useState<UppyFile[]>([]);
    const [submitProfilePhoto] = useSubmitProfilePhotoMutation();
    const allowedFileTypes = useMemo(() => ["image/*", ".jpg", ".jpeg", ".png", ".gif", ".webp"], []);
    const uppy = useMemo(() => {
        const uppy = new Uppy({
            id: "profile-photo-upload",
            meta: {
                registrantId: registrant.id,
            },
            allowMultipleUploads: false,
            restrictions: {
                allowedFileTypes,
                maxNumberOfFiles: 1,
                minNumberOfFiles: 1,
            },
            autoProceed: false,
        });

        uppy?.use(AwsS3Multipart, {
            limit: 4,
            companionUrl: import.meta.env.SNOWPACK_PUBLIC_COMPANION_BASE_URL,
        });
        return uppy;
    }, [allowedFileTypes, registrant.id]);

    const updateFiles = useCallback(() => {
        const validNameRegex = /^[a-zA-Z0-9.!*'()\-_ ]+$/;
        if (uppy) {
            const invalidFiles = uppy
                ?.getFiles()
                .filter((file) => !validNameRegex.test(file.name) || file.size > 1024 * 1024);
            for (const invalidFile of invalidFiles) {
                if (invalidFile.size > 1024 * 1024) {
                    toast({
                        position: "top",
                        status: "error",
                        description: intl.formatMessage({
                            id: 'Conference.Attend.Profile.EditProfilePictureForm.MaximumFileSize',
                            defaultMessage: "Maximum file size is 1MiB."
                        }),
                    });
                    uppy.removeFile(invalidFile.id);
                } else {
                    toast({
                        position: "top",
                        status: "error",
                        description: intl.formatMessage({
                            id: 'Conference.Attend.Profile.EditProfilePictureForm.InvalidFileName',
                            defaultMessage: "Invalid file name. File names must only contain letters, numbers, spaces and the following special characters: !*'()-_"
                        }),
                    });
                    uppy.removeFile(invalidFile.id);
                }
            }

            setFiles(uppy.getFiles());
        }
    }, [toast, uppy]);

    useEffect(() => {
        uppy?.on("file-added", updateFiles);
        uppy?.on("file-removed", updateFiles);
    }, [registrant, toast, updateFiles, uppy]);

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
                            description: intl.formatMessage({
                                id: 'Conference.Attend.Profile.EditProfilePictureForm.FailedToUploadTryAgain',
                                defaultMessage: "Failed to upload file. Please try again."
                            }),
                        });
                        uppy.reset();
                        return;
                    }

                    if (result.failed.length > 0 || result.successful.length < 1) {
                        console.error("Failed to upload file", result.failed);
                        toast({
                            position: "top",
                            status: "error",
                            description: intl.formatMessage({
                                id: 'Conference.Attend.Profile.EditProfilePictureForm.FailedToUploadTryAgain',
                                defaultMessage: "Failed to upload file. Please try again."
                            }),
                        });
                        uppy.reset();
                        return;
                    }

                    try {
                        const s3URL = result.successful[0].uploadURL;
                        const submitResult = await submitProfilePhoto({
                            variables: {
                                s3URL,
                                registrantId: registrant.id,
                            },
                            update: (cache, result) => {
                                if (result.data?.updateProfilePhoto) {
                                    const data = result.data.updateProfilePhoto;

                                    const id = cache.identify({
                                        __typename: "registrant_Profile",
                                        registrantId: registrant.id,
                                    });

                                    const frag = cache.readFragment<ProfileDataFragment>({
                                        fragment: ProfileDataFragmentDoc,
                                        fragmentName: "ProfileData",
                                        id,
                                    });

                                    if (frag) {
                                        cache.writeFragment({
                                            id,
                                            data: {
                                                ...frag,
                                                photoURL_350x350: data.photoURL_350x350 ?? "",
                                                photoURL_50x50: data.photoURL_50x50 ?? "",
                                                hasBeenEdited: true,
                                            },
                                            fragment: ProfileDataFragmentDoc,
                                            fragmentName: "ProfileData",
                                            broadcast: true,
                                        });
                                    }
                                }
                            },
                        });

                        if (submitResult.errors || !submitResult.data?.updateProfilePhoto?.ok) {
                            throw new Error("Upload failed.");
                        }

                        toast({
                            position: "top",
                            status: "success",
                            description: intl.formatMessage({
                                id: 'Conference.Attend.Profile.EditProfilePictureForm.UploadedSuccessfully',
                                defaultMessage: "Uploaded file successfully."
                            }),
                        });

                        uppy.reset();

                        if (handleFormSubmitted) {
                            await handleFormSubmitted();
                        }
                    } catch (e: any) {
                        console.error("Failed to upload file", e);
                        toast({
                            status: "error",
                            title: intl.formatMessage({
                                id: 'Conference.Attend.Profile.EditProfilePictureForm.FailedToUpload',
                                defaultMessage: "Failed to upload file."
                            }),
                            description: e?.message ?? intl.formatMessage({
                                id: 'Conference.Attend.Profile.EditProfilePictureForm.TryAgain',
                                defaultMessage: "Please try again later."
                            }),
                        });
                        uppy.reset();
                        return;
                    }
                }}
            >
                {({ dirty, isSubmitting, isValid }) => (
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
                                    backgroundColor="#222"
                                >
                                    {files.length === 1 || registrant.profile.photoURL_350x350 ? (
                                        <Image
                                            mt={2}
                                            alt={
                                                files.length === 1
                                                    ? intl.formatMessage({
                                                        id: 'Conference.Attend.Profile.EditProfilePictureForm.FilePreview',
                                                        defaultMessage: "Preview of the selected file."
                                                    })
                                                    : intl.formatMessage({
                                                        id: 'Conference.Attend.Profile.EditProfilePictureForm.CurrentProfilePicture',
                                                        defaultMessage: "Your current profile picture."
                                                    })
                                            }
                                            src={
                                                (files.length === 1
                                                    ? URL.createObjectURL(files[0].data)
                                                    : registrant.profile.photoURL_350x350) as string
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
                                                : !registrant.profile.photoURL_350x350
                                                ? "Please upload a picture."
                                                : undefined}
                                        </Text>
                                    </Flex>
                                    <Box display={files.length === 1 ? "none" : ""}>
                                        <DragDrop width={350} height={350} uppy={uppy} allowMultipleFiles={false} />
                                    </Box>
                                    {registrant.profile.photoURL_350x350 ? (
                                        <Button
                                            isLoading={isDeleting}
                                            pos="absolute"
                                            aria-label={intl.formatMessage({
                                                id: 'Conference.Attend.Profile.EditProfilePictureForm.RemoveProfilePicture',
                                                defaultMessage: "Remove profile picture"
                                            })}
                                            colorScheme="DestructiveActionButton"
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
                                                                registrantId: registrant.id,
                                                            },
                                                            update: (cache) => {
                                                                const id = cache.identify({
                                                                    __typename: "registrant_Profile",
                                                                    registrantId: registrant.id,
                                                                });

                                                                const frag = cache.readFragment<ProfileDataFragment>({
                                                                    fragment: ProfileDataFragmentDoc,
                                                                    fragmentName: "ProfileData",
                                                                    id,
                                                                });

                                                                if (frag) {
                                                                    cache.writeFragment({
                                                                        id,
                                                                        data: {
                                                                            ...frag,
                                                                            photoURL_350x350: "",
                                                                            photoURL_50x50: "",
                                                                        },
                                                                        fragment: ProfileDataFragmentDoc,
                                                                        fragmentName: "ProfileData",
                                                                        broadcast: true,
                                                                    });
                                                                }
                                                            },
                                                        });
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
                                    <FormattedMessage
                                        id="Conference.Attend.Profile.EditProfilePictureForm.FileTypes"
                                        defaultMessage="File types: {types}."
                                        values={{ types: allowedFileTypes.join(", ") }}
                                    /><br />
                                    <FormattedMessage
                                        id="Conference.Attend.Profile.EditProfilePictureForm.MaximumFileSize"
                                        defaultMessage="Maximum file size is 1MiB."
                                    />
                                </FormHelperText>
                            </FormControl>

                            <StatusBar uppy={uppy} hideAfterFinish hideUploadButton />
                            <Button
                                colorScheme="PrimaryActionButton"
                                isLoading={isSubmitting}
                                type="submit"
                                isDisabled={!isValid || files.length !== 1}
                                mt={2}
                            >
                                <FormattedMessage
                                    id="Conference.Attend.Profile.EditProfilePictureForm.Upload"
                                    defaultMessage="Upload"
                                />
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </>
    );
}
