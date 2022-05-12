import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    HStack,
    Input,
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
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { ElementBaseType, isElementDataBlob } from "@midspace/shared-types/content";
import type { YouTubeDataBlob } from "@midspace/shared-types/registrantGoogleAccount";
import { isYouTubeDataBlob } from "@midspace/shared-types/registrantGoogleAccount";
import { gql } from "@urql/core";
import Mustache from "mustache";
import * as R from "ramda";
import React, { useCallback, useContext, useEffect, useMemo } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useFieldArray, useForm } from "react-hook-form";
import { useClient } from "urql";
import type {
    Job_Queues_UploadYouTubeVideoJob_Insert_Input,
    UploadYouTubeVideos_GetTemplateDataQuery,
    UploadYouTubeVideos_GetTemplateDataQueryVariables,
} from "../../../../../generated/graphql";
import {
    UploadYouTubeVideos_GetTemplateDataDocument,
    useUploadYouTubeVideos_CreateUploadYouTubeVideoJobsMutation,
    useUploadYouTubeVideos_GetElementsQuery,
    useUploadYouTubeVideos_RefreshYouTubeDataMutation,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import { useRestorableState } from "../../../../Hooks/useRestorableState";
import { useConference } from "../../../useConference";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { ChooseElementByTagModal } from "./ChooseElementByTagModal";
import { ChooseElementModal } from "./ChooseElementModal";
import { MetadataPreview } from "./MetadataPreview";
import { TemplateInstructions } from "./TemplateInstructions";
import { YouTubeExportContext } from "./YouTubeExportContext";

gql`
    query UploadYouTubeVideos_GetRegistrantGoogleAccounts($registrantId: uuid!) {
        registrant_GoogleAccount(where: { registrantId: { _eq: $registrantId } }) {
            id
            registrantId
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
            itemId
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
            itemId
            item {
                id
                shortTitle
                title
                elements {
                    id
                    itemId
                    youTubeUploads {
                        id
                        videoTitle
                        videoId
                        elementId
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
                authors: itemPeople(where: { roleName: { _eq: "AUTHOR" } }, order_by: { priority: asc }) {
                    id
                    itemId
                    personId
                    roleName
                    priority
                    person {
                        id
                        name
                        affiliation
                    }
                }
                presenters: itemPeople(where: { roleName: { _eq: "PRESENTER" } }, order_by: { priority: asc }) {
                    id
                    itemId
                    personId
                    roleName
                    priority
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
        itemId
        typeName
    }

    mutation UploadYouTubeVideos_RefreshYouTubeData($registrantId: uuid!, $registrantGoogleAccountId: uuid!) {
        refreshYouTubeData(registrantId: $registrantId, registrantGoogleAccountId: $registrantGoogleAccountId) {
            message
            success
        }
    }
`;

type FormValues = {
    elementIds: string[];
    titleTemplate: string;
    descriptionTemplate: string;
    channelId: string | null;
    playlistId: string | null;
    videoPrivacyStatus: string;
    titleCorrections: { value: string | null; id: string }[];
    descriptionCorrections: { value: string | null; id: string }[];
};

function VideoIcon() {
    return <FAIcon icon="video" iconStyle="s" />;
}

export function UploadYouTubeVideos(): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const toast = useToast();
    const registrant = useCurrentRegistrant();
    const { selectedGoogleAccountId, googleAccounts, refreshGoogleAccounts, finished, setFinished } =
        useContext(YouTubeExportContext);

    const [, refreshYouTubeData] = useUploadYouTubeVideos_RefreshYouTubeDataMutation();
    useEffect(() => {
        async function fn() {
            if (selectedGoogleAccountId) {
                const result = await refreshYouTubeData(
                    {
                        registrantId: registrant.id,
                        registrantGoogleAccountId: selectedGoogleAccountId,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: subconferenceId
                                    ? HasuraRoleName.SubconferenceOrganizer
                                    : HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                );
                if (!result.data?.refreshYouTubeData?.success) {
                    throw new Error(result.data?.refreshYouTubeData?.message ?? "Unknown reason");
                }
                refreshGoogleAccounts();
            }
        }
        fn();
    }, [refreshGoogleAccounts, refreshYouTubeData, registrant.id, selectedGoogleAccountId, subconferenceId]);

    const [youTubeTitleTemplate, setYouTubeTitleTemplate] = useRestorableState(
        "clowdr-youTubeTitleTemplate",
        "{{{itemTitle}}} ({{{fileName}}})",
        (x) => x,
        (x) => x
    );
    const [youTubeDescriptionTemplate, setYouTubeDescriptionTemplate] = useRestorableState(
        "clowdr-youTubeDescriptionTemplate-v2",
        `{{#abstract}}{{{abstract}}}

{{/abstract}}
{{#authors.length}}
{{#authors}}{{{name}}}{{#affiliation}} ({{{affiliation}}}){{/affiliation}}, {{/authors}}

{{/authors.length}}
{{#paperLinks.length}}
{{#paperLinks}}{{#url}}
* {{{text}}}: {{{url}}}
{{/url}}{{/paperLinks}}

{{/paperLinks.length}}
{{#paperUrls.length}}
{{#paperUrls}}{{#.}}* {{{.}}}
{{/.}}{{/paperUrls}}

{{/paperUrls.length}}
`,
        (x) => x,
        (x) => x
    );

    const {
        formState: { errors, touchedFields, isSubmitting, isValid },
        handleSubmit,
        setValue,
        trigger,
        register,
        reset,
        watch,
        control,
    } = useForm<FormValues>({
        defaultValues: {
            elementIds: [],
            titleTemplate: youTubeTitleTemplate,
            descriptionTemplate: youTubeDescriptionTemplate,
            channelId: "",
            playlistId: "",
            videoPrivacyStatus: "unlisted",
            titleCorrections: [],
            descriptionCorrections: [],
        },
        mode: "all",
    });
    const titleCorrectionsFields = useFieldArray({
        control,
        name: "titleCorrections",
    });
    const descriptionCorrectionsFields = useFieldArray({
        control,
        name: "descriptionCorrections",
    });

    const elementIds = watch("elementIds");
    const channelId = watch("channelId");
    const titleTemplate = watch("titleTemplate");
    const descriptionTemplate = watch("descriptionTemplate");
    useEffect(() => setYouTubeTitleTemplate(titleTemplate), [setYouTubeTitleTemplate, titleTemplate]);
    useEffect(
        () => setYouTubeDescriptionTemplate(descriptionTemplate),
        [setYouTubeDescriptionTemplate, descriptionTemplate]
    );

    const channelOptions = useMemo(() => {
        const registrantGoogleAccount = googleAccounts.data?.registrant_GoogleAccount.find(
            (a) => a.id === selectedGoogleAccountId
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
    }, [selectedGoogleAccountId, googleAccounts]);

    const playlistOptions = useMemo(() => {
        const registrantGoogleAccount = googleAccounts.data?.registrant_GoogleAccount.find(
            (a) => a.id === selectedGoogleAccountId
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
    }, [selectedGoogleAccountId, channelId, googleAccounts]);

    const [, createJobs] = useUploadYouTubeVideos_CreateUploadYouTubeVideoJobsMutation();

    const chooseVideoDisclosure = useDisclosure();
    const chooseByTagDisclosure = useDisclosure();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [{ data }] = useUploadYouTubeVideos_GetElementsQuery({
        variables: {
            elementIds,
        },
        context,
    });

    const elements = useMemo(() => {
        const pairs: [string, { name: string; itemTitle: string }][] =
            data?.content_Element.map((element) => [
                element.id,
                { name: element.name, itemTitle: element.item.title },
            ]) ?? [];

        return R.fromPairs(pairs);
    }, [data]);

    const client = useClient();
    const compileTemplates = useCallback(
        async (
            elementIds: string[],
            titleTemplateString: string,
            descriptionTemplateString: string
        ): Promise<{ [elementId: string]: { title: string; description: string } }> => {
            const result = await client
                .query<UploadYouTubeVideos_GetTemplateDataQuery, UploadYouTubeVideos_GetTemplateDataQueryVariables>(
                    UploadYouTubeVideos_GetTemplateDataDocument,
                    { elementIds },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: subconferenceId
                                    ? HasuraRoleName.SubconferenceOrganizer
                                    : HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                )
                .toPromise();

            const pairs = elementIds.map((elementId): [string, { title: string; description: string }] => {
                if (!result || !result.data) {
                    console.error("Could not retrieve data for content item templates", result.error);
                    throw new Error("Could not retrieve data for content item templates");
                }

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

                const elementName = element.name;
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

                const presenters = element.item.presenters.map((presenter) => ({
                    name: presenter.person.name,
                    affiliation: presenter.person.affiliation ?? "",
                }));

                const view = {
                    fileId: elementId, // deprecated
                    elementId,
                    fileName: elementName, // deprecated
                    elementName,
                    itemId: element.item.id,
                    itemTitle,
                    abstract,
                    itemShortTitle,
                    paperUrls,
                    paperLinks,
                    youTubeUploads,
                    authors,
                    presenters,
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
        [client, subconferenceId]
    );

    const getDescriptionError = useCallback((description: string) => {
        const length = new TextEncoder().encode(description).length;
        const invalid = description.includes("<") || description.includes(">");
        const errors = [
            ...(length > 4950 ? ["Description is too long."] : []),
            ...(invalid ? ["Description cannot contain '<' or '>'."] : []),
        ];
        return errors.join(" ");
    }, []);

    const onSubmit: SubmitHandler<FormValues> = useCallback(
        async (data: FormValues) => {
            try {
                trigger(undefined);
                const details = await compileTemplates(data.elementIds, data.titleTemplate, data.descriptionTemplate);
                console.log(data);
                const updatedPairs = R.mapObjIndexed(
                    (x, key) => ({
                        title: data.titleCorrections.find((x) => x.id === key)?.value ?? x.title,
                        description: data.descriptionCorrections.find((x) => x.id === key)?.value ?? x.description,
                    }),
                    details
                );

                const invalidTitles = R.filter(([, x]) => x.title.length > 100, R.toPairs(updatedPairs));
                console.log(invalidTitles);

                titleCorrectionsFields.replace(
                    invalidTitles.map(
                        ([elementId, values]) =>
                            data.titleCorrections.find((x) => x.id === elementId) ?? {
                                id: elementId,
                                value: values.title,
                            }
                    )
                );
                invalidTitles.forEach(([elementId], idx) => setValue(`titleCorrections.${idx}.id`, elementId));

                const invalidDescriptions = R.filter(
                    ([, x]) => Boolean(getDescriptionError(x.description)),
                    R.toPairs(updatedPairs)
                );
                console.log(invalidDescriptions);

                descriptionCorrectionsFields.replace(
                    invalidDescriptions.map(
                        ([elementId, values]) =>
                            data.descriptionCorrections.find((x) => x.id === elementId) ?? {
                                id: elementId,
                                value: values.description,
                            }
                    )
                );
                invalidDescriptions.forEach(([elementId], idx) =>
                    setValue(`descriptionCorrections.${idx}.id`, elementId)
                );

                if (Object.keys(invalidTitles).length || Object.keys(invalidDescriptions).length) {
                    toast({
                        status: "info",
                        title: "You need to make some corrections before starting the upload",
                    });
                    trigger(undefined, { shouldFocus: true });
                    return;
                }

                await createJobs(
                    {
                        objects: data.elementIds.map(
                            (id): Job_Queues_UploadYouTubeVideoJob_Insert_Input => ({
                                elementId: id,
                                registrantGoogleAccountId: selectedGoogleAccountId,
                                conferenceId: conference.id,
                                videoTitle: updatedPairs[id]?.title ?? id,
                                videoDescription: updatedPairs[id]?.description ?? "",
                                videoPrivacyStatus: data.videoPrivacyStatus,
                                playlistId: data.playlistId,
                            })
                        ),
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: subconferenceId
                                    ? HasuraRoleName.SubconferenceOrganizer
                                    : HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                );
                toast({
                    status: "success",
                    title: "Starting upload to YouTube",
                });
                reset();
                setValue("titleTemplate", youTubeTitleTemplate);
                setValue("descriptionTemplate", youTubeDescriptionTemplate);
                setFinished(true);
            } catch (err: any) {
                console.error("Error while creating YouTube upload jobs", err);
                toast({
                    status: "error",
                    title: "Failed to create YouTube upload job",
                    description: err.message,
                });
            }
        },
        [
            compileTemplates,
            conference.id,
            createJobs,
            descriptionCorrectionsFields,
            getDescriptionError,
            reset,
            selectedGoogleAccountId,
            setFinished,
            setValue,
            subconferenceId,
            titleCorrectionsFields,
            toast,
            trigger,
            youTubeDescriptionTemplate,
            youTubeTitleTemplate,
        ]
    );

    return !finished && selectedGoogleAccountId ? (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Heading as="h2" size="md" textAlign="left" my={4}>
                Choose videos to upload
            </Heading>

            <FormControl isInvalid={Boolean(errors.elementIds) && Boolean(touchedFields.elementIds)} isRequired>
                <Button aria-label="add a single video" size="sm" onClick={() => chooseVideoDisclosure.onOpen()}>
                    <FAIcon icon="plus-square" iconStyle="s" mr={2} />
                    Add a video
                </Button>
                <ChooseElementModal
                    chooseItem={(elementId) => setValue("elementIds", R.union(elementIds, [elementId]))}
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
                    chooseItems={(newElementIds) => setValue("elementIds", R.union(elementIds, newElementIds))}
                    isOpen={chooseByTagDisclosure.isOpen}
                    onClose={chooseByTagDisclosure.onClose}
                />

                <Button
                    aria-label="clear all videos"
                    size="sm"
                    ml={4}
                    onClick={() => setValue("elementIds", [])}
                    isDisabled={elementIds.length === 0}
                >
                    <FAIcon icon="trash-alt" iconStyle="r" mr={2} />
                    Clear all
                </Button>

                <List mt={4} spacing={2}>
                    {elementIds.map((id: string) => (
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
                                <Popover isLazy>
                                    <PopoverTrigger>
                                        <Button
                                            size="xs"
                                            aria-label="preview title and description"
                                            title="Preview title and description"
                                            colorScheme="pink"
                                            style={{ marginLeft: "auto" }}
                                        >
                                            <FAIcon icon="file-alt" iconStyle="r" fontSize="xs" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <MetadataPreview
                                            elementId={id}
                                            compileTemplate={compileTemplates}
                                            titleTemplate={youTubeTitleTemplate}
                                            descriptionTemplate={youTubeDescriptionTemplate}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Button
                                    size="xs"
                                    aria-label="remove video"
                                    colorScheme="red"
                                    style={{ marginLeft: "5px" }}
                                    onClick={() => {
                                        setValue("elementIds", R.without([id], elementIds));
                                    }}
                                >
                                    <FAIcon icon="trash-alt" iconStyle="r" fontSize="xs" />
                                </Button>
                            </HStack>
                        </ListItem>
                    ))}
                    {elementIds.length === 0 ? (
                        <Text fontStyle="italic">No videos selected.</Text>
                    ) : (
                        <Text fontStyle="italic">
                            {elementIds.length} video
                            {elementIds.length > 1 ? "s" : ""} selected
                        </Text>
                    )}
                </List>
            </FormControl>

            <Heading as="h2" size="md" textAlign="left" my={4}>
                Set video privacy
            </Heading>

            <FormControl
                isInvalid={Boolean(errors.videoPrivacyStatus) && Boolean(touchedFields.videoPrivacyStatus)}
                isRequired
            >
                <FormLabel htmlFor="videoPrivacyStatus" mt={2}>
                    Video privacy
                </FormLabel>
                <Select {...register("videoPrivacyStatus")} id="videoPrivacyStatus" mt={2}>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                </Select>
                <FormErrorMessage>{errors.videoPrivacyStatus?.message}</FormErrorMessage>
            </FormControl>

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
                        <TemplateInstructions />
                    </PopoverBody>
                </PopoverContent>
            </Popover>
            <FormControl isInvalid={Boolean(errors.titleTemplate) && Boolean(touchedFields.titleTemplate)} isRequired>
                <FormLabel mt={2}>Video title template</FormLabel>
                <Input {...register("titleTemplate")} placeholder="{{fileName}}" mt={2} />
                <FormErrorMessage>{errors.titleTemplate?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
                isInvalid={Boolean(errors.descriptionTemplate) && Boolean(touchedFields.descriptionTemplate)}
                isRequired
            >
                <FormLabel mt={2}>Video description template</FormLabel>
                <Textarea {...register("descriptionTemplate")} placeholder="{{abstract}}" mt={2} />
                <FormErrorMessage>{errors.descriptionTemplate?.message}</FormErrorMessage>
            </FormControl>

            <Heading as="h2" size="md" textAlign="left" my={4}>
                Choose upload location
            </Heading>

            <FormControl isInvalid={Boolean(errors.channelId) && Boolean(touchedFields.channelId)} isRequired>
                <FormLabel mt={2}>Channel</FormLabel>
                <Select
                    {...register("channelId")}
                    placeholder="Choose channel"
                    mt={2}
                    isDisabled={!selectedGoogleAccountId}
                >
                    {channelOptions}
                </Select>
                <FormErrorMessage>{errors.channelId?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={Boolean(errors.playlistId) && Boolean(touchedFields.playlistId)}>
                <FormLabel htmlFor="playlistId" mt={2}>
                    Playlist
                </FormLabel>
                <Select
                    {...register("playlistId")}
                    id="playlistId"
                    placeholder="Choose playlist"
                    isDisabled={!selectedGoogleAccountId}
                    mt={2}
                >
                    {playlistOptions}
                </Select>
                <FormErrorMessage>{errors.playlistId?.message}</FormErrorMessage>
            </FormControl>

            {Boolean(titleCorrectionsFields.fields.length) && (
                <Heading as="h2" size="md" textAlign="left" my={4}>
                    Corrected video titles
                </Heading>
            )}
            {titleCorrectionsFields.fields.map((field, idx) => (
                <FormControl key={field.id} isInvalid={Boolean(errors.titleCorrections?.[idx]?.value)} isRequired>
                    <FormLabel mt={2}>
                        Title for {elements?.[field.id]?.name} ({elements?.[field.id]?.itemTitle})
                    </FormLabel>
                    <Input
                        {...register(`titleCorrections.${idx}.value`, { maxLength: 100 })}
                        placeholder="Replacement title"
                    />
                    <FormErrorMessage>
                        {errors.titleCorrections?.[idx]?.value?.type === "maxLength" &&
                            "Title must not exceed 100 characters."}
                    </FormErrorMessage>
                </FormControl>
            ))}

            {Boolean(descriptionCorrectionsFields.fields.length) && (
                <Heading as="h2" size="md" textAlign="left" my={4}>
                    Corrected video descriptions
                </Heading>
            )}
            {descriptionCorrectionsFields.fields.map((field, idx) => (
                <FormControl key={field.id} isInvalid={Boolean(errors.descriptionCorrections?.[idx]?.value)} isRequired>
                    <FormLabel mt={2}>
                        Description for {elements?.[field.id]?.name} ({elements?.[field.id]?.itemTitle})
                    </FormLabel>
                    <Textarea
                        {...register(`descriptionCorrections.${idx}.value`, {
                            maxLength: 4950,
                            validate: { angleBrackets: (x) => !x?.includes("<") && !x?.includes(">") },
                        })}
                        placeholder="Replacement description"
                    />
                    <FormErrorMessage>
                        {errors.descriptionCorrections?.[idx]?.value?.type === "maxLength" &&
                            "Description must not exceed 4950 characters. "}
                        {errors.descriptionCorrections?.[idx]?.value?.type === "angleBrackets" &&
                            "Description must not contain '<' or '>' characters. "}
                    </FormErrorMessage>
                </FormControl>
            ))}

            <Button
                type="submit"
                isLoading={isSubmitting}
                isDisabled={!isValid || !elementIds.length}
                mt={4}
                colorScheme="purple"
            >
                Upload videos
            </Button>
        </form>
    ) : (
        <></>
    );
}
