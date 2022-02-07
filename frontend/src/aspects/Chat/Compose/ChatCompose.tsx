import type { BoxProps } from "@chakra-ui/react";
import {
    Box,
    Button,
    Code,
    Flex,
    Tag,
    Text,
    Textarea,
    Tooltip,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import "@uppy/status-bar/dist/style.css";
import AmazonS3URI from "amazon-s3-uri";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import FAIcon from "../../Chakra/FAIcon";
import { ChatSpacing, useChatConfiguration } from "../Configuration";
import type { AnswerMessageData, MessageMediaData } from "../Types/Messages";
import { MediaType } from "../Types/Messages";
import { useComposeContext } from "./ComposeContext";
import { InsertEmojiButton } from "./InsertEmojiButton";
import { MessageTypeButtons } from "./MessageTypeButtons";
import { CreatePollOptionsButton } from "./Poll/CreatePollOptionsButton";
import { SendMessageButton } from "./SendMessageButton";

const StatusBar = React.lazy(() => import("@uppy/react").then((x) => ({ default: x.StatusBar })));

export function ChatCompose({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();
    const cappedSpacing = Math.min(config.spacing, ChatSpacing.COMFORTABLE);

    const composeCtx = useComposeContext();
    const composeBoxRef = React.useRef<HTMLTextAreaElement | null>(null);

    const messageTypeMoniker =
        composeCtx.newMessageType === Chat_MessageType_Enum.Poll
            ? "poll question. Set choices using the button in the bottom-right."
            : composeCtx.newMessageType.toLowerCase();

    const toast = useToast();
    const onPollOptionsModalOpenRef = useRef<{
        onOpen: () => void;
    }>({
        onOpen: () => {
            /*EMPTY*/
        },
    });

    const [sendFailed, setSendFailed] = useState<string | number | null>(null);
    const failedToSend_BgColor = useColorModeValue("ChatError.backgroundColor-light", "ChatError.backgroundColor-dark");
    const failedToSend_TextColor = useColorModeValue("ChatError.textColor-light", "ChatError.textColor-dark");
    useEffect(() => {
        let tId: number | undefined;
        if (composeCtx.sendError && sendFailed === null) {
            const toastId = toast({
                description: (
                    <VStack alignItems="flex-start">
                        <Text as="p">
                            Sorry, your message failed to send. Please try again in a moment. If the error noted below
                            persists, please contact our technical support.
                        </Text>
                        <Text as="pre" bgColor={failedToSend_BgColor}>
                            <Code color={failedToSend_TextColor}>{composeCtx.sendError}</Code>
                        </Text>
                    </VStack>
                ),
                isClosable: true,
                position: "bottom-right",
                status: "error",
                title: "Failed to send",
            });
            setSendFailed(toastId ?? null);
            setTimeout(() => {
                setSendFailed(null);
            }, 1000);
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [composeCtx, composeCtx.sendError, failedToSend_BgColor, failedToSend_TextColor, sendFailed, toast]);

    useEffect(() => {
        if (
            composeCtx.newMessageType === Chat_MessageType_Enum.Answer &&
            (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds
        ) {
            composeBoxRef.current?.focus();
        }
    }, [composeBoxRef, composeCtx.newMessageData, composeCtx.newMessageType]);

    const [wasSending, setWasSending] = useState<boolean>(true);
    useEffect(() => {
        if (wasSending && !composeCtx.isSending) {
            composeBoxRef.current?.focus();
        }
        setWasSending(composeCtx.isSending);
    }, [composeCtx.isSending, wasSending]);

    const borderColour = useColorModeValue("ChatCompose.borderColor-light", "ChatCompose.borderColor-dark");
    const borderColourFaded = useColorModeValue(
        "ChatCompose.borderColorFaded-light",
        "ChatCompose.borderColorFaded-dark"
    );

    const allowedFileTypes = useMemo(
        () => [
            "image/bmp",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "video/av1",
            "video/mp4",
            "video/H264",
            "video/H265",
            "video/JPEG",
            "video/VP8",
            "video/VP9",
            "video/ogg",
            "audio/mpeg",
            "audio/mp4",
            "audio/mp3",
            "audio/ogg",
            "audio/wav",
            "audio/vorbis",
            "audio/aac",
            "text/csv",
            "text/xml",
            "text/plain",
            "application/json",
            "application/pdf",
        ],
        []
    );
    const allowedFileTypesStr = useMemo(() => allowedFileTypes.join(","), [allowedFileTypes]);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const uppy = useMemo(() => {
        const uppy = new Uppy({
            id: "chat-message-media-upload",
            meta: {},
            allowMultipleUploads: false,
            allowMultipleUploadBatches: false,
            restrictions: {
                allowedFileTypes,
                maxNumberOfFiles: 1,
                minNumberOfFiles: 1,
                maxFileSize: 100 * 1024 * 1024,
            },
            autoProceed: false,
        });

        uppy.use(AwsS3Multipart, {
            limit: 4,
            companionUrl:
                typeof import.meta.env.VITE_COMPANION_BASE_URL === "string"
                    ? import.meta.env.VITE_COMPANION_BASE_URL
                    : "",
        });
        return uppy;
    }, [allowedFileTypes]);

    useEffect(() => {
        const onUpdateFiles = async () => {
            const validNameRegex = /^[a-zA-Z0-9.!*'()\-_ ]+$/;
            const invalidFiles = uppy?.getFiles().filter((file) => !validNameRegex.test(file.name));
            for (const invalidFile of invalidFiles) {
                toast({
                    status: "error",
                    description:
                        "Invalid file name. File names must only contain letters, numbers, spaces and the following special characters: !*'()-_",
                });
                uppy.removeFile(invalidFile.id);
            }

            const finalFiles = uppy.getFiles();

            if (finalFiles.length === 1) {
                composeCtx.setFile({ file: finalFiles[0] });

                let result;
                try {
                    result = await uppy.upload();
                } catch (e) {
                    console.error("Failed to upload file", e);
                    toast({
                        status: "error",
                        description: "Failed to upload file. Please try again.",
                    });
                    uppy.reset();
                    composeCtx.setFile(null);
                    return;
                }

                if (result.failed.length > 0 || result.successful.length < 1) {
                    console.error("Failed to upload file", result.failed);
                    toast({
                        status: "error",
                        description: "Failed to upload file. Please try again later.",
                    });
                    uppy.reset();
                    composeCtx.setFile(null);
                    return;
                }

                try {
                    const { bucket, key } = new AmazonS3URI(result.successful[0].uploadURL);
                    assert.truthy(bucket);
                    assert.truthy(key);

                    uppy.reset();
                    const url = `https://${bucket}.s3-${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
                    let type: MediaType;
                    switch (finalFiles[0].type) {
                        case "image/bmp":
                            type = MediaType.Image;
                            break;
                        case "image/png":
                            type = MediaType.Image;
                            break;
                        case "image/jpeg":
                            type = MediaType.Image;
                            break;
                        case "image/jpg":
                            type = MediaType.Image;
                            break;
                        case "image/gif":
                            type = MediaType.Image;
                            break;
                        case "video/av1":
                            type = MediaType.Video;
                            break;
                        case "video/mp4":
                            type = MediaType.Video;
                            break;
                        case "video/H264":
                            type = MediaType.Video;
                            break;
                        case "video/H265":
                            type = MediaType.Video;
                            break;
                        case "video/JPEG":
                            type = MediaType.Video;
                            break;
                        case "video/VP8":
                            type = MediaType.Video;
                            break;
                        case "video/VP9":
                            type = MediaType.Video;
                            break;
                        case "video/ogg":
                            type = MediaType.Video;
                            break;
                        case "audio/mpeg":
                            type = MediaType.Audio;
                            break;
                        case "audio/mp4":
                            type = MediaType.Audio;
                            break;
                        case "audio/mp3":
                            type = MediaType.Audio;
                            break;
                        case "audio/ogg":
                            type = MediaType.Audio;
                            break;
                        case "audio/wav":
                            type = MediaType.Audio;
                            break;
                        case "audio/vorbis":
                            type = MediaType.Audio;
                            break;
                        case "audio/aac":
                            type = MediaType.Audio;
                            break;
                        case "text/csv":
                            type = MediaType.CSV;
                            break;
                        case "text/xml":
                            type = MediaType.XML;
                            break;
                        case "text/plain":
                            type = MediaType.Text;
                            break;
                        case "application/json":
                            type = MediaType.JSON;
                            break;
                        case "application/pdf":
                            type = MediaType.PDF;
                            break;
                        default:
                            throw new Error("Unrecognised type");
                    }
                    const mediaData: MessageMediaData = {
                        type,
                        name: finalFiles[0].name ?? "No file name",
                        url,
                        alt: "No alt text provided.",
                    };
                    composeCtx.setFile({ file: finalFiles[0], data: mediaData });
                } catch (e: any) {
                    console.error("Failed to submit file", e);
                    toast({
                        status: "error",
                        title: "Failed to submit file.",
                        description: e?.message ?? "Please try again later.",
                    });
                    uppy.reset();
                    composeCtx.setFile(null);
                    return;
                }
            } else {
                composeCtx.setFile(null);
            }
        };
        uppy.on("file-added", onUpdateFiles);
        uppy.on("file-removed", onUpdateFiles);

        const onUploadSuccess = () => {
            toast({
                status: "success",
                description: "Uploaded successfully.",
            });
        };
        uppy.on("upload-success", onUploadSuccess);

        const onError = (err: Error) => {
            console.error("Error while uploading file", { err });
            toast({
                status: "error",
                title: "Error while uploading file",
                description: `${err.name}: ${err.message}`,
            });
        };
        uppy.on("error", onError);

        const onUploadError = (_file: unknown, err: Error) => {
            console.error("Error while uploading file", { err });
            toast({
                status: "error",
                title: "Error while uploading file",
                description: `${err.name}: ${err.message}`,
            });
        };
        uppy.on("upload-error", onUploadError);

        return () => {
            uppy.off("file-added", onUpdateFiles);
            uppy.off("file-removed", onUpdateFiles);
            uppy.off("upload-success", onUploadSuccess);
            uppy.off("error", onError);
            uppy.off("upload-error", onUploadError);
        };
    }, [toast, uppy, composeCtx]);

    return (
        <VStack
            spacing={0}
            justifyContent="center"
            alignItems="flex-start"
            pos="relative"
            p="1px"
            borderTop="1px solid"
            borderTopColor={borderColour}
            {...rest}
        >
            <MessageTypeButtons isDisabled={composeCtx.isSending} w="100%" />
            <Box pos="relative" w="100%" h="10vh" borderTop="1px solid" borderTopColor={borderColourFaded} pt="1px">
                <Textarea
                    ref={composeBoxRef}
                    pos="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    fontSize={config.fontSizeRange.value}
                    borderRadius={0}
                    border="none"
                    p={cappedSpacing}
                    aria-label={`Compose your ${messageTypeMoniker}`}
                    placeholder={`Compose your ${messageTypeMoniker}`}
                    onChange={(ev) => {
                        composeCtx.setNewMessage(ev.target.value);
                    }}
                    value={composeCtx.newMessage}
                    minLength={composeCtx.messageLengthRange.min}
                    maxLength={composeCtx.messageLengthRange.max}
                    autoFocus
                    isDisabled={composeCtx.isSending}
                    onKeyDown={(ev) => {
                        if (ev.key === "Enter" && !ev.shiftKey) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            if (composeCtx.newMessageType === Chat_MessageType_Enum.Poll) {
                                onPollOptionsModalOpenRef.current?.onOpen();
                            } else if (composeCtx.readyToSend) {
                                composeCtx.send();
                            } else if (composeCtx.newMessage.length > 0 && composeCtx.blockedReason) {
                                toast({
                                    id: "chat-compose-blocked-reason",
                                    isClosable: true,
                                    duration: 1500,
                                    position: "bottom-right",
                                    description: composeCtx.blockedReason,
                                    status: "info",
                                });
                            }
                        }
                    }}
                    _disabled={{
                        cursor: "progress",
                        opacity: 0.4,
                    }}
                    transition="none"
                />
                {/* <MessageTypeIndicator
                    messageType={composeCtx.newMessageType}
                    pos="absolute"
                    top={0}
                    right={cappedSpacing}
                    transform="translate(0, calc(-100% - 3px))"
                    opacity={0.7}
                /> */}
            </Box>
            <Flex w="100%" alignItems="stretch" justifyContent="stretch" flexDir="column">
                <Suspense fallback={null}>
                    <StatusBar uppy={uppy} hideAfterFinish hideUploadButton />
                </Suspense>
            </Flex>
            <Flex w="100%" minH="2.4em" alignItems="center">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept={allowedFileTypesStr}
                    style={{ display: "none" }}
                    onChange={(ev) => {
                        uppy.getFiles().map((file) => uppy.removeFile(file.name));
                        if (ev.target.files?.length) {
                            try {
                                uppy.addFile({
                                    data: ev.target.files[0],
                                    name: ev.target.files[0].name,
                                    type: ev.target.files[0].type,
                                    meta: {
                                        name: ev.target.files[0].name,
                                        type: ev.target.files[0].type,
                                    },
                                });
                            } catch (e: any) {
                                console.info("Error selecting file for chat media upload", e);
                                if (e.toString().includes("You can only upload")) {
                                    toast({
                                        title: "Unsupported file type",
                                        description: "Only images, audio, video, PDF or text files are allowed.",
                                        status: "error",
                                        position: "bottom-right",
                                        isClosable: true,
                                    });
                                } else if (e.toString().includes("exceeds maximum allowed size")) {
                                    toast({
                                        title: "File must be less than 100MB",
                                        status: "error",
                                        position: "bottom-right",
                                        isClosable: true,
                                    });
                                } else {
                                    toast({
                                        title: "Something went wrong. Please check your connection and try again.",
                                        status: "error",
                                        position: "bottom-right",
                                        isClosable: true,
                                    });
                                }
                            }
                        }
                    }}
                />
                {composeCtx.file ? (
                    <Tag
                        ml={1}
                        colorScheme="SecondaryActionButton"
                        variant={composeCtx.file?.data ? "solid" : "subtle"}
                        onClick={() => {
                            if (composeCtx.file?.data) {
                                composeCtx.setFile(null);
                            }
                        }}
                        cursor="pointer"
                        aria-label="Remove media"
                    >
                        {composeCtx.file.file.name}
                        {composeCtx.file?.data ? (
                            <>
                                &nbsp;&nbsp;
                                <FAIcon iconStyle="s" icon="times" />
                            </>
                        ) : undefined}
                    </Tag>
                ) : (
                    <Button
                        size="xs"
                        colorScheme="PrimaryActionButton"
                        variant="ghost"
                        ml={1}
                        onClick={() => {
                            fileInputRef.current?.click();
                        }}
                    >
                        <FAIcon iconStyle="s" icon="paperclip" />
                        &nbsp; Attach media
                    </Button>
                )}
                {composeCtx.newMessageType === Chat_MessageType_Enum.Answer ? (
                    <Flex
                        fontSize={config.fontSizeRange.value * 0.7}
                        overflowWrap="break-word"
                        whiteSpace="break-spaces"
                        p={0}
                        mx="auto"
                        justifyContent="center"
                        alignItems="center"
                        w="100%"
                    >
                        <Text
                            as="span"
                            h="auto"
                            borderColor="gray.400"
                            borderWidth={1}
                            borderStyle="solid"
                            borderRadius={10}
                            display="inline-block"
                            p={1}
                        >
                            {(composeCtx.newMessageData as AnswerMessageData).questionMessagesIds &&
                            (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds?.[0]
                                ? "Answering message"
                                : //     `Answering message ${
                                //       (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds?.[0]
                                //   }`
                                (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds &&
                                  (composeCtx.newMessageData as AnswerMessageData).questionMessagesSIds?.[0]
                                ? "Answering message"
                                : //         `Answering message ${
                                  //       (composeCtx.newMessageData as AnswerMessageData).questionMessagesSIds?.[0]?.split(
                                  //           "-"
                                  //       )[0]
                                  //   }`
                                  "Select a question to answer"}
                        </Text>
                    </Flex>
                ) : undefined}
                <InsertEmojiButton
                    ml="auto"
                    onSelect={(data: any) => {
                        // TODO: Not sure why emoji-mart don't include the "native" property in their types
                        const emoji = (data as { native: string }).native;
                        composeCtx.setNewMessage(composeCtx.newMessage + emoji);
                    }}
                    isDisabled={composeCtx.isSending}
                />
                <Tooltip label={composeCtx.blockedReason}>
                    <Box m="3px" tabIndex={0}>
                        {composeCtx.newMessageType === Chat_MessageType_Enum.Poll ? (
                            <CreatePollOptionsButton
                                sendFailed={sendFailed !== null}
                                m={0}
                                onOpenRef={onPollOptionsModalOpenRef}
                                isDisabled={!composeCtx.readyToSend}
                                isLoading={composeCtx.isSending}
                            />
                        ) : (
                            <SendMessageButton
                                sendFailed={sendFailed !== null}
                                isDisabled={!composeCtx.readyToSend || !!(composeCtx.file && !composeCtx.file?.data)}
                                isLoading={composeCtx.isSending}
                                onClick={() => {
                                    composeCtx.send();
                                }}
                            />
                        )}
                    </Box>
                </Tooltip>
            </Flex>
        </VStack>
    );
}
