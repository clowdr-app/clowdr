import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Link,
    List,
    ListItem,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Spinner,
    Text,
    Tooltip,
    useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { useManageContent_SelectUploadersQuery } from "../../../../../../generated/graphql";
import { FAIcon } from "../../../../../Icons/FAIcon";

gql`
    fragment ManageContent_Uploader on content_Uploader {
        id
        uploadableElementId
        email
        name
        emailsSentCount
        conferenceId
    }

    query ManageContent_SelectUploaders($uploadableElementId: uuid!) {
        content_Uploader(where: { uploadableElementId: { _eq: $uploadableElementId } }) {
            ...ManageContent_Uploader
        }
    }
`;

export function EditUploaders({ uploadableElementId }: { uploadableElementId: string }): JSX.Element {
    const uploadersResponse = useManageContent_SelectUploadersQuery({
        variables: {
            uploadableElementId: uploadableElementId,
        },
    });

    const bgColor = useColorModeValue("green.50", "green.900");

    if (uploadersResponse.loading || !uploadersResponse.data) {
        return <Spinner label="Loading uploaders" />;
    } else {
        return (
            <>
                <HStack w="100%" mt={4} mb={2}>
                    <Tooltip label="Send submission request emails to all uploaders of this element.">
                        <Button
                            size="xs"
                            aria-label="Send submission request emails to all uploaders of this element."
                            onClick={() => {
                                // TODO: Send multiple submission request email
                            }}
                            mr={3}
                        >
                            <FAIcon iconStyle="s" icon="envelope" />
                        </Button>
                    </Tooltip>
                    <Popover placement="bottom-start" isLazy>
                        <PopoverTrigger>
                            <Button
                                size="xs"
                                aria-label="Add uploader"
                                onClick={() => {
                                    // TODO: Add uploader
                                }}
                                mr={2}
                                colorScheme="green"
                            >
                                <FAIcon iconStyle="s" icon="plus" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent bgColor={bgColor}>
                            <PopoverHeader>Add uploader</PopoverHeader>
                            <PopoverBody>TODO</PopoverBody>
                            <PopoverFooter>TOOD</PopoverFooter>
                        </PopoverContent>
                    </Popover>
                    <Heading as="h4" fontSize="sm" textAlign="left" pl={1}>
                        Uploaders
                    </Heading>
                </HStack>
                <Box overflow="auto" w="100%">
                    <List minW="max-content">
                        {uploadersResponse.data.content_Uploader.map((uploader) => (
                            <ListItem key={uploader.id} w="100%" mb={1}>
                                <Flex w="100%" alignItems="flex-start">
                                    <Tooltip
                                        label={`Send submission request email to ${uploader.email}. ${uploader.emailsSentCount} previously sent.`}
                                    >
                                        <Button
                                            size="xs"
                                            aria-label={`Send submission request email to ${uploader.email}. ${uploader.emailsSentCount} previously sent.`}
                                            onClick={() => {
                                                // TODO: Send single submission request email
                                            }}
                                            mr={2}
                                        >
                                            <FAIcon iconStyle="s" icon="envelope" />
                                            &nbsp;&nbsp;{uploader.emailsSentCount}
                                        </Button>
                                    </Tooltip>
                                    <Tooltip label="Edit uploader">
                                        <Button
                                            size="xs"
                                            aria-label="Edit uploader"
                                            onClick={() => {
                                                // TODO: Edit uploader
                                            }}
                                            mr={2}
                                        >
                                            <FAIcon iconStyle="s" icon="edit" />
                                        </Button>
                                    </Tooltip>
                                    <Text mr="auto">{uploader.name}</Text>
                                    <Text ml={2} mr={2}>
                                        &lt;
                                        <Link isExternal href={`mailto:${uploader.email}`}>
                                            {uploader.email}
                                        </Link>
                                        &gt;
                                    </Text>
                                    <Tooltip label="Delete uploader">
                                        <Button
                                            size="xs"
                                            colorScheme="red"
                                            aria-label="Delete uploader"
                                            onClick={() => {
                                                // TODO: Delete uploader
                                            }}
                                        >
                                            <FAIcon iconStyle="s" icon="trash-alt" />
                                        </Button>
                                    </Tooltip>
                                </Flex>
                            </ListItem>
                        ))}
                        {uploadersResponse.data.content_Uploader.length === 0 ? (
                            <ListItem>No uploaders listed. Use the plus button above to add an uploader.</ListItem>
                        ) : undefined}
                    </List>
                </Box>
            </>
        );
    }
}
