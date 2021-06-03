import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Code,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    HStack,
    Input,
    Link,
    List,
    ListIcon,
    ListItem,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Select,
    Spinner,
    Text,
    Textarea,
    Tooltip,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { ElementBaseType, ElementDataBlob, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { isYouTubeDataBlob, YouTubeDataBlob } from "@clowdr-app/shared-types/build/registrantGoogleAccount";
import { Field, FieldArray, FieldProps, Form, Formik } from "formik";
import Mustache from "mustache";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import {
    Job_Queues_UploadYouTubeVideoJob_Insert_Input,
    UploadYouTubeVideos_UploadYouTubeVideoJobFragment,
    useUploadYouTubeVideos_CreateUploadYouTubeVideoJobsMutation,
    useUploadYouTubeVideos_GetElementsQuery,
    useUploadYouTubeVideos_GetRegistrantGoogleAccountsQuery,
    useUploadYouTubeVideos_GetTemplateDataQuery,
    useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery,
    useUploadYouTubeVideos_RefreshYouTubeDataMutation,
    Video_JobStatus_Enum,
} from "../../../../generated/graphql";
import { useRestorableState } from "../../../Generic/useRestorableState";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import { ChooseElementByTagModal } from "./ChooseElementByTagModal";
import { ChooseElementModal } from "./ChooseElementModal";

gql`
    query UploadYouTubeVideos_GetUploadYouTubeVideoJobs($conferenceId: uuid!) {
        job_queues_UploadYouTubeVideoJob(
            where: { conferenceId: { _eq: $conferenceId }, jobStatusName: { _neq: COMPLETED } }
            order_by: { createdAt: desc }
        ) {
            ...UploadYouTubeVideos_UploadYouTubeVideoJob
        }
    }

    fragment UploadYouTubeVideos_UploadYouTubeVideoJob on job_queues_UploadYouTubeVideoJob {
        id
        jobStatusName
        element {
            id
            item {
                id
                title
            }
            name
        }
    }

    query UploadYouTubeVideos_GetRegistrantGoogleAccounts($registrantId: uuid!) {
        registrant_GoogleAccount(where: { registrantId: { _eq: $registrantId } }) {
            id
            googleAccountEmail
            youTubeData
        }
    }

    mutation UploadYouTubeVideos_CreateUploadYouTubeVideoJobs(
        $objects: [job_queues_UploadYouTubeVideoJob_insert_input!]!
    ) {
        insert_job_queues_UploadYouTubeVideoJob(objects: $objects) {
            returning {
                id
            }
        }
    }

    query UploadYouTubeVideos_GetElements($elementIds: [uuid!]!) {
        content_Element(where: { id: { _in: $elementIds } }) {
            id
            name
            item {
                id
                title
            }
        }
    }

    query UploadYouTubeVideos_GetTemplateData($elementIds: [uuid!]!) {
        content_Element(where: { id: { _in: $elementIds } }) {
            id
            name
            item {
                id
                shortTitle
                title
                elements {
                    id
                    youTubeUploads {
                        id
                        videoTitle
                        videoId
                    }
                }
                abstractElements: elements(
                    where: { typeName: { _eq: ABSTRACT } }
                    order_by: { updatedAt: desc }
                    limit: 1
                ) {
                    ...UploadYouTubeVideos_Element
                }
                paperLinkElements: elements(where: { typeName: { _eq: PAPER_LINK } }) {
                    ...UploadYouTubeVideos_Element
                }
                paperUrlElements: elements(where: { typeName: { _eq: PAPER_URL } }) {
                    ...UploadYouTubeVideos_Element
                }
                authors: itemPeople(where: { roleName: { _eq: "AUTHOR" } }) {
                    id
                    person {
                        id
                        name
                        affiliation
                    }
                }
            }
        }
    }

    fragment UploadYouTubeVideos_Element on content_Element {
        id
        data
    }

    mutation UploadYouTubeVideos_RefreshYouTubeData($registrantId: uuid!, $registrantGoogleAccountId: uuid!) {
        refreshYouTubeData(registrantId: $registrantId, registrantGoogleAccountId: $registrantGoogleAccountId) {
            message
            success
        }
    }
`;

function VideoIcon() {
    return <FAIcon icon="video" iconStyle="s" />;
}

export function UploadYouTubeVideos(): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    const registrant = useCurrentRegistrant();

    const existingJobsResult = useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 10000,
    });

    const googleAccountsResult = useUploadYouTubeVideos_GetRegistrantGoogleAccountsQuery({
        variables: {
            registrantId: registrant.id,
        },
    });

    const googleAccountOptions = useMemo(() => {
        return googleAccountsResult.data?.registrant_GoogleAccount.map((account) => (
            <option key={account.id} value={account.id}>
                {account.googleAccountEmail}
            </option>
        ));
    }, [googleAccountsResult.data?.registrant_GoogleAccount]);

    const [registrantGoogleAccountId, setRegistrantGoogleAccountId] = useState<string | null>(null);
    const channelOptions = useMemo(() => {
        const registrantGoogleAccount = googleAccountsResult.data?.registrant_GoogleAccount.find(
            (a) => a.id === registrantGoogleAccountId
        );

        if (!isYouTubeDataBlob(registrantGoogleAccount?.youTubeData)) {
            return [];
        }

        const youTubeData = registrantGoogleAccount?.youTubeData as YouTubeDataBlob;

        return (
            youTubeData.channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                    {channel.title}
                </option>
            )) ?? []
        );
    }, [registrantGoogleAccountId, googleAccountsResult.data?.registrant_GoogleAccount]);

    const [channelId, setChannelId] = useState<string | null>(null);
    const playlistOptions = useMemo(() => {
        const registrantGoogleAccount = googleAccountsResult.data?.registrant_GoogleAccount.find(
            (a) => a.id === registrantGoogleAccountId
        );

        if (!isYouTubeDataBlob(registrantGoogleAccount?.youTubeData)) {
            return [];
        }

        const youTubeData = registrantGoogleAccount?.youTubeData as YouTubeDataBlob;

        return (
            youTubeData.channels
                .find((c) => c.id === channelId)
                ?.playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                        {playlist.title}
                    </option>
                )) ?? []
        );
    }, [registrantGoogleAccountId, channelId, googleAccountsResult.data?.registrant_GoogleAccount]);

    const [createJobs] = useUploadYouTubeVideos_CreateUploadYouTubeVideoJobsMutation();

    const chooseVideoDisclosure = useDisclosure();
    const chooseByTagDisclosure = useDisclosure();

    const [elementIds, setElementIds] = useState<string[]>([]);
    const { data } = useUploadYouTubeVideos_GetElementsQuery({
        variables: {
            elementIds,
        },
    });

    const elements = useMemo(() => {
        const pairs: [string, { name: string; itemTitle: string }][] =
            data?.content_Element.map((element) => [
                element.id,
                { name: element.name, itemTitle: element.item.title },
            ]) ?? [];

        return R.fromPairs(pairs);
    }, [data]);

    const { refetch: refetchTemplateData } = useUploadYouTubeVideos_GetTemplateDataQuery({ skip: true });

    const compileTemplates = useCallback(
        async (
            elementIds: string[],
            titleTemplateString: string,
            descriptionTemplateString: string
        ): Promise<{ [elementId: string]: { title: string; description: string } }> => {
            const result = await refetchTemplateData({ elementIds });

            if (!result || !result.data) {
                console.error("Could not retrieve data for content item templates", result.error, result.errors);
                throw new Error("Could not retrieve data for content item templates");
            }

            const pairs = elementIds.map((elementId): [string, { title: string; description: string }] => {
                const element = result.data.content_Element.find((x) => x.id === elementId);

                if (!element) {
                    return [
                        elementId,
                        {
                            title: titleTemplateString,
                            description: descriptionTemplateString,
                        },
                    ];
                }

                const fileName = element.name;
                const itemTitle = element.item.title;
                const itemShortTitle = element.item.shortTitle;
                const abstractElement = element.item.abstractElements.length
                    ? element.item.abstractElements[0]
                    : undefined;
                const abstractElementData = isElementDataBlob(abstractElement?.data)
                    ? (abstractElement?.data as ElementDataBlob)
                    : undefined;
                const abstractElementDataLatest = abstractElementData ? R.last(abstractElementData) : undefined;
                const abstract =
                    abstractElementDataLatest?.data.baseType === ElementBaseType.Text
                        ? abstractElementDataLatest.data.text
                        : "";

                const paperUrls = R.flatten(
                    element.item.paperUrlElements.map((item) => {
                        if (!isElementDataBlob(item.data)) {
                            return [];
                        }

                        const dataBlob = item.data as ElementDataBlob;
                        const latest = R.last(dataBlob);

                        if (!latest) {
                            return [];
                        }

                        if (latest.data.baseType === ElementBaseType.URL) {
                            return [latest.data.url];
                        } else {
                            return [];
                        }
                    })
                );

                const paperLinks = R.flatten(
                    element.item.paperLinkElements.map((item) => {
                        if (!isElementDataBlob(item.data)) {
                            return [];
                        }

                        const dataBlob = item.data as ElementDataBlob;
                        const latest = R.last(dataBlob);

                        if (!latest) {
                            return [];
                        }

                        if (latest.data.baseType === ElementBaseType.Link) {
                            return [{ url: latest.data.url, text: latest.data.text }];
                        } else {
                            return [];
                        }
                    })
                );

                const youTubeUploads = R.flatten(
                    element.item.elements.map((item) =>
                        item.youTubeUploads.map((upload) => ({
                            title: upload.videoTitle,
                            url: `https://www.youtube.com/watch?v=${upload.videoId}`,
                        }))
                    )
                );

                const authors = element.item.authors.map((author) => ({
                    name: author.person.name,
                    affiliation: author.person.affiliation ?? "",
                }));

                const view = {
                    fileId: elementId,
                    fileName,
                    itemId: element.item.id,
                    itemTitle,
                    abstract,
                    itemShortTitle,
                    paperUrls,
                    paperLinks,
                    youTubeUploads,
                    authors,
                };

                return [
                    elementId,
                    {
                        title: Mustache.render(titleTemplateString, view),
                        description: Mustache.render(descriptionTemplateString, view),
                    },
                ];
            });

            return R.fromPairs(pairs);
        },
        [refetchTemplateData]
    );

    const jobStatus = useCallback((jobStatusName: Video_JobStatus_Enum) => {
        switch (jobStatusName) {
            case Video_JobStatus_Enum.Completed:
                return (
                    <Tooltip label="Upload completed">
                        <FAIcon icon="check-circle" iconStyle="s" aria-label="completed" />
                    </Tooltip>
                );
            case Video_JobStatus_Enum.Expired:
            case Video_JobStatus_Enum.Failed:
                return (
                    <Tooltip label="Upload failed">
                        <FAIcon icon="exclamation-circle" iconStyle="s" aria-label="error" />
                    </Tooltip>
                );
            case Video_JobStatus_Enum.InProgress:
            case Video_JobStatus_Enum.New:
                return <Spinner size="sm" aria-label="in progress" />;
        }
    }, []);

    const [refreshYouTubeData] = useUploadYouTubeVideos_RefreshYouTubeDataMutation();

    const getDescriptionError = useCallback((description: string) => {
        const length = new TextEncoder().encode(description).length;
        const invalid = description.includes("<") || description.includes(">");
        const errors = [
            ...(length > 4950 ? ["Description is too long."] : []),
            ...(invalid ? ["Description cannot contain '<' or '>'."] : []),
        ];
        return errors.join(" ");
    }, []);

    const [youTubeTitleTemplate, setYouTubeTitleTemplate] = useRestorableState(
        "clowdr-youTubeTitleTemplate",
        "{{itemTitle}} ({{fileName}})",
        (x) => x,
        (x) => x
    );
    const [youTubeDescriptionTemplate, setYouTubeDescriptionTemplate] = useRestorableState(
        "clowdr-youTubeDescriptionTemplate-v2",
        `{{#abstract}}{{abstract}}

{{/abstract}}
{{#authors.length}}
{{#authors}}
{{name}}{{#affiliation}} ({{affiliation}}){{/affiliation}}, 
{{/authors}}

{{/authors.length}}
{{#paperLinks.length}}
{{#paperLinks}}{{#url}}
* {{text}}: {{url}}
{{/url}}{{/paperLinks}}

{{/paperLinks.length}}
{{#paperUrls.length}}
{{#paperUrls}}{{#.}}* {{.}}
{{/.}}{{/paperUrls}}

{{/paperUrls.length}}
`,
        (x) => x,
        (x) => x
    );

    return (
        <>
            <HStack alignItems="flex-start">
                <VStack alignItems="flex-start" flexGrow={1}>
                    <Formik<{
                        elementIds: string[];
                        registrantGoogleAccountId: string | null;
                        titleTemplate: string;
                        descriptionTemplate: string;
                        channelId: string | null;
                        playlistId: string | null;
                        videoPrivacyStatus: string;
                        titleCorrections: { [elementId: string]: string };
                        descriptionCorrections: { [elementId: string]: string };
                    }>
                        initialValues={{
                            elementIds: [],
                            registrantGoogleAccountId: null,
                            titleTemplate: youTubeTitleTemplate,
                            descriptionTemplate: youTubeDescriptionTemplate,
                            channelId: null,
                            playlistId: null,
                            videoPrivacyStatus: "unlisted",
                            titleCorrections: {},
                            descriptionCorrections: {},
                        }}
                        onSubmit={async (values, actions) => {
                            try {
                                const details = await compileTemplates(
                                    values.elementIds,
                                    values.titleTemplate,
                                    values.descriptionTemplate
                                );

                                const updatedPairs = R.mapObjIndexed(
                                    (x, key) => ({
                                        title: values.titleCorrections[key] ?? x.title,
                                        description: values.descriptionCorrections[key] ?? x.description,
                                    }),
                                    details
                                );

                                let correctionsNeeded = false;

                                const invalidTitles = R.filter((x) => x.title.length > 100, updatedPairs);

                                R.forEachObjIndexed((value, elementId) => {
                                    const fieldName = `titleCorrections.${elementId}`;
                                    actions.setFieldValue(fieldName, value.title ?? null);
                                    actions.setFieldError(fieldName, "Title cannot be more than 100 characters");
                                    correctionsNeeded = true;
                                }, invalidTitles);

                                R.forEachObjIndexed((value, elementId) => {
                                    const fieldName = `descriptionCorrections.${elementId}`;
                                    const error = getDescriptionError(value.description);
                                    if (error) {
                                        actions.setFieldValue(fieldName, value.description ?? null);
                                        actions.setFieldError(fieldName, error);
                                        correctionsNeeded = true;
                                    }
                                }, updatedPairs);

                                if (correctionsNeeded) {
                                    toast({
                                        status: "info",
                                        title: "You need to make some corrections before starting the upload",
                                    });
                                    return;
                                }

                                await createJobs({
                                    variables: {
                                        objects: values.elementIds.map(
                                            (id): Job_Queues_UploadYouTubeVideoJob_Insert_Input => ({
                                                elementId: id,
                                                registrantGoogleAccountId: values.registrantGoogleAccountId,
                                                conferenceId: conference.id,
                                                videoTitle: updatedPairs[id]?.title ?? id,
                                                videoDescription: updatedPairs[id]?.description ?? "",
                                                videoPrivacyStatus: values.videoPrivacyStatus,
                                                playlistId: values.playlistId,
                                            })
                                        ),
                                    },
                                });
                                toast({
                                    status: "success",
                                    title: "Starting upload to YouTube",
                                });
                                actions.resetForm();
                                actions.setFieldValue("titleTemplate", youTubeTitleTemplate);
                                actions.setFieldValue("descriptionTemplate", youTubeDescriptionTemplate);
                                setRegistrantGoogleAccountId(null);
                                await existingJobsResult.refetch();
                            } catch (e) {
                                console.error("Error while creating YouTube upload jobs", e);
                                toast({
                                    status: "error",
                                    title: "Failed to create YouTube upload job",
                                    description: e.message,
                                });
                            }
                        }}
                    >
                        {({ isSubmitting, isValid, values, touched }) => {
                            if (!R.isEmpty(R.symmetricDifference(values.elementIds, elementIds))) {
                                setElementIds(values.elementIds);
                            }

                            return (
                                <Form>
                                    <Heading as="h2" size="md" textAlign="left" my={4}>
                                        Choose videos to upload
                                    </Heading>
                                    <Field
                                        name="elementIds"
                                        validate={(ids: string[]) =>
                                            ids.length > 0 ? undefined : "Must choose at least one video"
                                        }
                                    >
                                        {({ field, form }: FieldProps<string[]>) => (
                                            <FormControl
                                                isInvalid={!!form.errors.elementIds && !!form.touched.elementIds}
                                                isRequired
                                            >
                                                <Button
                                                    aria-label="add a single video"
                                                    size="sm"
                                                    onClick={() => chooseVideoDisclosure.onOpen()}
                                                >
                                                    <FAIcon icon="plus-square" iconStyle="s" mr={2} />
                                                    Add a video
                                                </Button>
                                                <ChooseElementModal
                                                    chooseItem={(elementId) =>
                                                        form.setFieldValue(
                                                            field.name,
                                                            R.union(form.values.elementIds, [elementId])
                                                        )
                                                    }
                                                    isOpen={chooseVideoDisclosure.isOpen}
                                                    onClose={chooseVideoDisclosure.onClose}
                                                />
                                                <Button
                                                    aria-label="add a videos by tag"
                                                    size="sm"
                                                    ml={4}
                                                    onClick={() => chooseByTagDisclosure.onOpen()}
                                                >
                                                    <FAIcon icon="plus-square" iconStyle="s" mr={2} />
                                                    Add videos by tag
                                                </Button>
                                                <ChooseElementByTagModal
                                                    chooseItems={(elementIds) =>
                                                        form.setFieldValue(
                                                            field.name,
                                                            R.union(form.values.elementIds, elementIds)
                                                        )
                                                    }
                                                    isOpen={chooseByTagDisclosure.isOpen}
                                                    onClose={chooseByTagDisclosure.onClose}
                                                />

                                                <Button
                                                    aria-label="clear all videos"
                                                    size="sm"
                                                    ml={4}
                                                    onClick={() => form.setFieldValue(field.name, [])}
                                                    isDisabled={form.values.elementIds.length === 0}
                                                >
                                                    <FAIcon icon="trash-alt" iconStyle="r" mr={2} />
                                                    Clear all
                                                </Button>

                                                <List mt={4} spacing={2}>
                                                    {form.values.elementIds.map((id: string) => (
                                                        <ListItem key={id}>
                                                            <HStack>
                                                                <ListIcon as={VideoIcon} />
                                                                {elements[id] ? (
                                                                    <Text pr={4}>
                                                                        {elements[id].name} ({elements[id].itemTitle})
                                                                    </Text>
                                                                ) : (
                                                                    <Spinner />
                                                                )}
                                                                <Button
                                                                    size="xs"
                                                                    aria-label="remove video"
                                                                    colorScheme="red"
                                                                    style={{ marginLeft: "auto" }}
                                                                    onClick={() => {
                                                                        form.setFieldValue(
                                                                            field.name,
                                                                            R.without([id], form.values.elementIds)
                                                                        );
                                                                    }}
                                                                >
                                                                    <FAIcon
                                                                        icon="trash-alt"
                                                                        iconStyle="r"
                                                                        fontSize="xs"
                                                                    />
                                                                </Button>
                                                            </HStack>
                                                        </ListItem>
                                                    ))}
                                                    {form.values.elementIds.length === 0 ? (
                                                        <Text fontStyle="italic">No videos selected.</Text>
                                                    ) : (
                                                        <Text fontStyle="italic">
                                                            {form.values.elementIds.length} video
                                                            {form.values.elementIds.length > 1 ? "s" : ""} selected
                                                        </Text>
                                                    )}
                                                </List>
                                                <FormErrorMessage>{form.errors.elementIds}</FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>

                                    <Heading as="h2" size="md" textAlign="left" my={4}>
                                        Set video privacy
                                    </Heading>

                                    <Field name="videoPrivacyStatus">
                                        {({ field, form }: FieldProps<string>) => (
                                            <FormControl
                                                isInvalid={
                                                    !!form.errors.videoPrivacyStatus &&
                                                    !!form.touched.videoPrivacyStatus
                                                }
                                                isRequired
                                            >
                                                <FormLabel htmlFor="videoPrivacyStatus" mt={2}>
                                                    Video privacy
                                                </FormLabel>
                                                <Select {...field} id="videoPrivacyStatus" mt={2}>
                                                    <option value="private">Private</option>
                                                    <option value="public">Public</option>
                                                    <option value="unlisted">Unlisted</option>
                                                </Select>
                                                <FormErrorMessage>{form.errors.videoPrivacyStatus}</FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>

                                    <Heading as="h2" size="md" textAlign="left" my={4}>
                                        Set video titles and descriptions
                                    </Heading>
                                    <Popover>
                                        <PopoverTrigger>
                                            <Button>
                                                <FAIcon icon="question-circle" iconStyle="s" mr={2} />
                                                Help
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent>
                                            <PopoverArrow />
                                            <PopoverCloseButton />
                                            <PopoverHeader>Title and description templates</PopoverHeader>
                                            <PopoverBody>
                                                <Text mb={2}>
                                                    Titles and descriptions for uploaded YouTube videos are defined
                                                    using <Link href="https://mustache.github.io/">Mustache</Link>{" "}
                                                    templates. The following fields are available:
                                                </Text>
                                                <List fontSize="sm">
                                                    <ListItem>
                                                        <Code>fileName</Code>: name of the file
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>itemTitle</Code>: title of the content item this video
                                                        belongs to
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>itemShortTitle</Code>: short title of the content item
                                                        this video belongs to
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>abstract</Code>: the abstract text for the content item
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>paperUrls</Code>: list of URLs to papers
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>paperLinks</Code>: list of links to papers. Properties are{" "}
                                                        <Code>url</Code>, <Code>text</Code>.
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>authors</Code>: list of authors. Properties are{" "}
                                                        <Code>name</Code>, <Code>affiliation</Code>.
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>youTubeUploads</Code>: list of previously uploaded YouTube
                                                        videos for this content item. Properties are <Code>url</Code>,{" "}
                                                        <Code>title</Code>.
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>fileId</Code>: unique ID of the file
                                                    </ListItem>
                                                    <ListItem>
                                                        <Code>itemId</Code>: unique ID of the item that contains this
                                                        file
                                                    </ListItem>
                                                </List>
                                                <Text mt={2}>Example:</Text>
                                                <Code display="block" whiteSpace="pre">
                                                    {`{{abstract}}
{{#youTubeUploads}}
    * {{title}}: {{{url}}}
{{/youTubeUploads}}`}
                                                </Code>
                                            </PopoverBody>
                                        </PopoverContent>
                                    </Popover>
                                    <Field name="titleTemplate">
                                        {({ field, form }: FieldProps<string>) => (
                                            <FormControl
                                                isInvalid={!!form.errors.titleTemplate && !!form.touched.titleTemplate}
                                                isRequired
                                            >
                                                <FormLabel htmlFor="titleTemplate" mt={2}>
                                                    Video title template
                                                </FormLabel>
                                                <Input
                                                    {...field}
                                                    id="titleTemplate"
                                                    placeholder="{{fileName}}"
                                                    mt={2}
                                                    onChange={(event) => {
                                                        setYouTubeTitleTemplate(event.target.value);
                                                        field.onChange(event);
                                                    }}
                                                />
                                                <FormErrorMessage>{form.errors.titleTemplate}</FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Field name="descriptionTemplate">
                                        {({ field, form }: FieldProps<string>) => (
                                            <FormControl
                                                isInvalid={
                                                    !!form.errors.descriptionTemplate &&
                                                    !!form.touched.descriptionTemplate
                                                }
                                                isRequired
                                            >
                                                <FormLabel htmlFor="descriptionTemplate" mt={2}>
                                                    Video description template
                                                </FormLabel>
                                                <Textarea
                                                    {...field}
                                                    id="descriptionTemplate"
                                                    placeholder="{{abstract}}"
                                                    mt={2}
                                                    onChange={(event) => {
                                                        setYouTubeDescriptionTemplate(event.target.value);
                                                        field.onChange(event);
                                                    }}
                                                />
                                                <FormErrorMessage>{form.errors.descriptionTemplate}</FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>

                                    <Heading as="h2" size="md" textAlign="left" my={4}>
                                        Choose upload location
                                    </Heading>
                                    <Field name="registrantGoogleAccountId">
                                        {({ field, form }: FieldProps<string>) => (
                                            <>
                                                <FormControl
                                                    isInvalid={
                                                        !!form.errors.registrantGoogleAccountId &&
                                                        !!form.touched.registrantGoogleAccountId
                                                    }
                                                    isRequired
                                                >
                                                    <FormLabel htmlFor="registrantGoogleAccountId" mt={2}>
                                                        Google Account
                                                    </FormLabel>
                                                    <Select
                                                        {...field}
                                                        id="registrantGoogleAccountId"
                                                        placeholder="Choose Google account"
                                                        mt={2}
                                                        onChange={(event) => {
                                                            setRegistrantGoogleAccountId(event.target.value);
                                                            field.onChange(event);
                                                        }}
                                                    >
                                                        {googleAccountOptions}
                                                    </Select>
                                                    <FormErrorMessage>
                                                        {form.errors.registrantGoogleAccountId}
                                                    </FormErrorMessage>
                                                </FormControl>
                                                <Button
                                                    display="block"
                                                    my={2}
                                                    size="sm"
                                                    aria-label="refresh playlists"
                                                    isDisabled={!form.values.registrantGoogleAccountId}
                                                    onClick={async () => {
                                                        try {
                                                            const result = await refreshYouTubeData({
                                                                variables: {
                                                                    registrantId: registrant.id,
                                                                    registrantGoogleAccountId:
                                                                        form.values.registrantGoogleAccountId,
                                                                },
                                                            });
                                                            if (!result.data?.refreshYouTubeData?.success) {
                                                                throw new Error(
                                                                    result.data?.refreshYouTubeData?.message ??
                                                                        "Unknown reason"
                                                                );
                                                            }

                                                            await googleAccountsResult.refetch({
                                                                registrantId: registrant.id,
                                                            });

                                                            toast({
                                                                status: "success",
                                                                title: "Refreshed YouTube channel details",
                                                            });
                                                        } catch (e) {
                                                            console.error(
                                                                "Failed to refresh YouTube channel details",
                                                                e
                                                            );
                                                            toast({
                                                                status: "error",
                                                                title: "Failed to refresh YouTube channel details",
                                                                description: e.message,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <HStack>
                                                        <FAIcon icon="sync" iconStyle="s" />
                                                        <Text ml={2}>Refresh</Text>
                                                    </HStack>
                                                </Button>
                                            </>
                                        )}
                                    </Field>

                                    <Field name="channelId">
                                        {({ field, form }: FieldProps<string>) => (
                                            <>
                                                <FormControl
                                                    isInvalid={!!form.errors.channelId && !!form.touched.channelId}
                                                    isRequired
                                                >
                                                    <FormLabel htmlFor="channelId" mt={2}>
                                                        Channel
                                                    </FormLabel>
                                                    <Select
                                                        {...field}
                                                        id="channelId"
                                                        placeholder="Choose channel"
                                                        mt={2}
                                                        isDisabled={!form.values.registrantGoogleAccountId}
                                                        onChange={(event) => {
                                                            setChannelId(event.target.value);
                                                            field.onChange(event);
                                                        }}
                                                    >
                                                        {channelOptions}
                                                    </Select>
                                                    <FormErrorMessage>{form.errors.channelId}</FormErrorMessage>
                                                </FormControl>
                                            </>
                                        )}
                                    </Field>

                                    <Field name="playlistId">
                                        {({ field, form }: FieldProps<string>) => (
                                            <>
                                                <FormControl
                                                    isInvalid={!!form.errors.playlistId && !!form.touched.playlistId}
                                                >
                                                    <FormLabel htmlFor="playlistId" mt={2}>
                                                        Playlist
                                                    </FormLabel>
                                                    <Select
                                                        {...field}
                                                        id="playlistId"
                                                        placeholder="Choose playlist"
                                                        isDisabled={!form.values.registrantGoogleAccountId}
                                                        mt={2}
                                                    >
                                                        {playlistOptions}
                                                    </Select>
                                                    <FormErrorMessage>{form.errors.playlistId}</FormErrorMessage>
                                                </FormControl>
                                            </>
                                        )}
                                    </Field>

                                    <FieldArray
                                        name="titleCorrections"
                                        render={(_arrayHelpers) =>
                                            values.titleCorrections &&
                                            Object.keys(values.titleCorrections).length > 0 ? (
                                                <>
                                                    <Heading as="h2" size="md" textAlign="left" my={4}>
                                                        Corrected video titles
                                                    </Heading>
                                                    {R.toPairs<string>(values.titleCorrections).map(
                                                        ([elementId, _title]) => (
                                                            <Field
                                                                key={elementId}
                                                                name={`titleCorrections.${elementId}`}
                                                                validate={(title: string) =>
                                                                    title.length <= 100
                                                                        ? undefined
                                                                        : "Title cannot be more than 100 characters"
                                                                }
                                                                isRequired
                                                            >
                                                                {({ field, form }: FieldProps<string>) => (
                                                                    <FormControl
                                                                        isInvalid={
                                                                            !!(form.errors.titleCorrections ??
                                                                                ({} as any))[elementId] &&
                                                                            !!(form.touched.titleCorrections ??
                                                                                ({} as any))[elementId]
                                                                        }
                                                                        isRequired
                                                                    >
                                                                        <FormLabel
                                                                            htmlFor={`titleCorrections.${elementId}`}
                                                                            mt={2}
                                                                        >
                                                                            Title for {elements[elementId].name} (
                                                                            {elements[elementId].itemTitle})
                                                                        </FormLabel>
                                                                        <Input
                                                                            {...field}
                                                                            id={`titleCorrections.${elementId}`}
                                                                            placeholder="Replacement title"
                                                                        />
                                                                        <FormErrorMessage>
                                                                            {
                                                                                (form.errors.titleCorrections ??
                                                                                    ({} as any))[elementId]
                                                                            }
                                                                        </FormErrorMessage>
                                                                    </FormControl>
                                                                )}
                                                            </Field>
                                                        )
                                                    )}
                                                </>
                                            ) : (
                                                <></>
                                            )
                                        }
                                    />

                                    <FieldArray
                                        name="descriptionCorrections"
                                        render={(_arrayHelpers) =>
                                            values.descriptionCorrections &&
                                            Object.keys(values.descriptionCorrections).length > 0 ? (
                                                <>
                                                    <Heading as="h2" size="md" textAlign="left" my={4}>
                                                        Corrected video descriptions
                                                    </Heading>
                                                    {R.toPairs<string>(values.descriptionCorrections).map(
                                                        ([elementId, _description]) => (
                                                            <Field
                                                                key={elementId}
                                                                name={`descriptionCorrections.${elementId}`}
                                                                validate={getDescriptionError}
                                                                isRequired
                                                            >
                                                                {({ field, form }: FieldProps<string>) => (
                                                                    <FormControl
                                                                        isInvalid={
                                                                            !!(form.errors.descriptionCorrections ??
                                                                                ({} as any))[elementId] &&
                                                                            !!(form.touched.descriptionCorrections ??
                                                                                ({} as any))[elementId]
                                                                        }
                                                                        isRequired
                                                                    >
                                                                        <FormLabel
                                                                            htmlFor={`descriptionCorrections.${elementId}`}
                                                                            mt={2}
                                                                        >
                                                                            Description for {elements[elementId].name} (
                                                                            {elements[elementId].itemTitle})
                                                                        </FormLabel>
                                                                        <Textarea
                                                                            {...field}
                                                                            id={`descriptionCorrections.${elementId}`}
                                                                            size="sm"
                                                                            placeholder="Replacement description"
                                                                        />
                                                                        <FormErrorMessage>
                                                                            {
                                                                                (form.errors.descriptionCorrections ??
                                                                                    ({} as any))[elementId]
                                                                            }
                                                                        </FormErrorMessage>
                                                                    </FormControl>
                                                                )}
                                                            </Field>
                                                        )
                                                    )}
                                                </>
                                            ) : (
                                                <></>
                                            )
                                        }
                                    />

                                    <Button
                                        type="submit"
                                        isLoading={isSubmitting}
                                        isDisabled={!isValid || !touched}
                                        mt={4}
                                        colorScheme="purple"
                                    >
                                        Upload videos
                                    </Button>
                                </Form>
                            );
                        }}
                    </Formik>
                </VStack>
                <ApolloQueryWrapper
                    queryResult={existingJobsResult}
                    getter={(result) => result.job_queues_UploadYouTubeVideoJob}
                >
                    {(jobs: readonly UploadYouTubeVideos_UploadYouTubeVideoJobFragment[]) => (
                        <VStack display={jobs.length ? "block" : "none"} maxWidth="30em">
                            <Heading as="h2" size="md" textAlign="left" mt={4} mb={2}>
                                Upload jobs
                            </Heading>
                            <List>
                                {jobs.length > 0 ? (
                                    jobs.map((job) => (
                                        <ListItem key={job.id}>
                                            <HStack>
                                                <Text data-jobid={job.id}>
                                                    {job.element?.item.title ?? "Unknown item"} (
                                                    {job.element?.name ?? "Unknown element"})
                                                </Text>
                                                <Box ml={2}>{jobStatus(job.jobStatusName)}</Box>
                                            </HStack>
                                        </ListItem>
                                    ))
                                ) : (
                                    <Text>No upload jobs.</Text>
                                )}
                            </List>
                        </VStack>
                    )}
                </ApolloQueryWrapper>
            </HStack>
        </>
    );
}
