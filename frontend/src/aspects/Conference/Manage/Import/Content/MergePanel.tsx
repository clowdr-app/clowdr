import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    FormControl,
    FormHelperText,
    Spinner,
    useToast,
} from "@chakra-ui/react";
import type { IntermediaryContentData } from "@clowdr-app/shared-types/build/import/intermediary";
import assert from "assert";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import JSONataQueryModal from "../../../../Files/JSONataQueryModal";
import FAIcon from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
import type { ExhibitionDescriptor, ItemDescriptor, ProgramPersonDescriptor } from "../../Content/Types";
import { useSaveContentDiff } from "../../Content/useSaveContentDiff";
import type { OriginatingDataDescriptor, TagDescriptor } from "../../Shared/Types";
import { ChangeSummary, Set_toJSON } from "../Merge";
import mergeContent from "./MergeContent";

function copyAuthorsToUploaders(
    groups: Map<string, ItemDescriptor>,
    people: Map<string, ProgramPersonDescriptor>
): void {
    groups.forEach((group) => {
        group.elements.forEach((uploadableElement) => {
            group.people.forEach((groupPerson) => {
                const person = people.get(groupPerson.personId);
                assert(
                    person,
                    `Person ${groupPerson.personId} not found: ${groupPerson.itemId} / ${groupPerson.priority} / ${
                        groupPerson.roleName
                    }\n${JSON.stringify(groupPerson)}`
                );
                if (
                    person.email &&
                    (groupPerson.roleName.toLowerCase() === "author" ||
                        groupPerson.roleName.toLowerCase() === "presenter")
                ) {
                    const email = person.email.trim().toLowerCase();
                    if (
                        !uploadableElement.uploaders.some((uploader) => uploader.email.trim().toLowerCase() === email)
                    ) {
                        uploadableElement.uploaders.push({
                            email,
                            emailsSentCount: 0,
                            id: uuidv4(),
                            name: person.name,
                            elementId: uploadableElement.id,
                            isNew: true,
                        });
                    }
                }
            });
        });
    });
}

export default function MergePanel({ data }: { data: Record<string, IntermediaryContentData> }): JSX.Element {
    const conference = useConference();
    const saveContentDiff = useSaveContentDiff();
    const {
        errorContent,
        loadingContent,
        originalItems,
        originalExhibitions,
        originalOriginatingDatas,
        originalPeople,
        originalTags,
    } = saveContentDiff;

    const [mergedGroupsMap, setMergedItemsMap] = useState<Map<string, ItemDescriptor>>();
    const [mergedPeopleMap, setMergedPeopleMap] = useState<Map<string, ProgramPersonDescriptor>>();
    const [mergedExhibitionsMap, setMergedExhibitionsMap] = useState<Map<string, ExhibitionDescriptor>>();
    const [mergedTagsMap, setMergedTagsMap] = useState<Map<string, TagDescriptor>>();
    const [mergedOriginatingDatasMap, setMergedOriginatingDatasMap] =
        useState<Map<string, OriginatingDataDescriptor>>();
    const [changes, setChanges] = useState<ChangeSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [shouldCopyAuthorsToUploaders, setShouldCopyAuthorsToUploaders] = useState<boolean>(true);

    useEffect(() => {
        if (originalItems && originalExhibitions && originalOriginatingDatas && originalPeople && originalTags) {
            try {
                setError(null);
                const merged = mergeContent(
                    conference.id,
                    data,
                    originalItems,
                    originalExhibitions,
                    originalOriginatingDatas,
                    originalPeople,
                    originalTags
                );
                if (shouldCopyAuthorsToUploaders) {
                    copyAuthorsToUploaders(merged.newItems, merged.newPeople);
                }
                setMergedItemsMap(merged.newItems);
                setMergedPeopleMap(merged.newPeople);
                setMergedExhibitionsMap(merged.newExhibitions);
                setMergedTagsMap(merged.newTags);
                setMergedOriginatingDatasMap(merged.newOriginatingDatas);
                setChanges(merged.changes);
                console.log("Merged", merged);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                window.merged = merged;
            } catch (e) {
                setMergedItemsMap(originalItems);
                setMergedPeopleMap(originalPeople);
                setMergedExhibitionsMap(originalExhibitions);
                setMergedTagsMap(originalTags);
                setMergedOriginatingDatasMap(originalOriginatingDatas);
                setChanges([]);
                setError(e.message);
            }
        }
    }, [
        conference.id,
        data,
        originalItems,
        originalExhibitions,
        originalOriginatingDatas,
        originalPeople,
        originalTags,
        shouldCopyAuthorsToUploaders,
    ]);

    const finalData = {
        groups: Array.from(mergedGroupsMap?.values() ?? []),
        people: Array.from(mergedPeopleMap?.values() ?? []),
        exhibitions: Array.from(mergedExhibitionsMap?.values() ?? []),
        tags: Array.from(mergedTagsMap?.values() ?? []),
        originatingDatas: Array.from(mergedOriginatingDatasMap?.values() ?? []),
    };

    const toast = useToast();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    return loadingContent &&
        (!mergedGroupsMap ||
            !mergedTagsMap ||
            !mergedPeopleMap ||
            !mergedOriginatingDatasMap ||
            !mergedExhibitionsMap) ? (
        <Spinner />
    ) : errorContent ? (
        <>An error occurred loading in data - please see further information in notifications.</>
    ) : (
        <>
            {error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>An error occurred</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : undefined}
            <FormControl mb={4}>
                <Checkbox
                    isChecked={shouldCopyAuthorsToUploaders}
                    onChange={(ev) => setShouldCopyAuthorsToUploaders(ev.target.checked)}
                >
                    Copy authors to uploaders
                </Checkbox>
                <FormHelperText>
                    If checked, for each content item, make people with the role &ldquo;Author&rdquo; uploaders for any
                    uploadable elements.
                </FormHelperText>
            </FormControl>
            {changes ? (
                <Alert status="info">
                    <AlertIcon />
                    <AlertTitle mr={2}>
                        {changes.length} change{changes.length !== 1 ? "s" : ""} detected.
                    </AlertTitle>
                    <AlertDescription>
                        <Button
                            aria-label="Copy changes summary JSON"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(changes, Set_toJSON, 2));
                            }}
                        >
                            <FAIcon iconStyle="r" icon="clipboard" />
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            <Box mt={2}>
                <ButtonGroup isAttached>
                    <JSONataQueryModal data={changes} buttonText="Changes Query Tool" defaultQuery={"$"} />
                    <Button
                        aria-label="Copy changes"
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(changes, Set_toJSON, 2));
                        }}
                    >
                        <FAIcon iconStyle="r" icon="clipboard" />
                    </Button>
                </ButtonGroup>
            </Box>
            <Box mt={2}>
                <ButtonGroup isAttached>
                    <JSONataQueryModal data={finalData} buttonText="Final Data Query Tool" defaultQuery={"$"} />
                    <Button
                        aria-label="Copy final dataset"
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(finalData, Set_toJSON, 2));
                        }}
                    >
                        <FAIcon iconStyle="r" icon="clipboard" />
                    </Button>
                </ButtonGroup>
            </Box>
            <Box mt={2}>
                <Button
                    disabled={
                        !!(
                            loadingContent ||
                            errorContent ||
                            error ||
                            !mergedGroupsMap ||
                            !mergedPeopleMap ||
                            !mergedExhibitionsMap ||
                            !mergedTagsMap ||
                            !mergedOriginatingDatasMap
                        ) || isSaving
                    }
                    isLoading={isSaving}
                    onClick={async () => {
                        setIsSaving(true);
                        assert(saveContentDiff.originalItems);
                        assert(mergedGroupsMap);
                        assert(mergedPeopleMap);
                        assert(mergedExhibitionsMap);
                        assert(mergedTagsMap);
                        assert(mergedOriginatingDatasMap);
                        const newOriginatingDataKeys = new Set(
                            Array.from(mergedOriginatingDatasMap.values())
                                .filter((x) => x.isNew)
                                .map((x) => x.id)
                        );
                        const results = await saveContentDiff.saveContentDiff(
                            {
                                groupKeys: new Set(mergedGroupsMap.keys()),
                                exhibitionKeys: new Set(mergedExhibitionsMap.keys()),
                                originatingDataKeys: newOriginatingDataKeys,
                                peopleKeys: new Set(mergedPeopleMap.keys()),
                                tagKeys: new Set(mergedTagsMap.keys()),
                            },
                            mergedTagsMap,
                            mergedPeopleMap,
                            mergedOriginatingDatasMap,
                            mergedGroupsMap,
                            mergedExhibitionsMap
                        );

                        const failures: { [K: string]: { k: string; v: any }[] } = {
                            groups: [],
                            exhibitions: [],
                            originatingDatas: [],
                            people: [],
                            tags: [],
                        };
                        results.groups.forEach((v, k) => {
                            if (!v) {
                                failures.groups.push({ k, v: mergedGroupsMap.get(k) });
                            }
                        });
                        results.exhibitions.forEach((v, k) => {
                            if (!v) {
                                failures.exhibitions.push({ k, v: mergedExhibitionsMap.get(k) });
                            }
                        });
                        results.originatingDatas.forEach((v, k) => {
                            if (!v) {
                                failures.originatingDatas.push({ k, v: mergedOriginatingDatasMap.get(k) });
                            }
                        });
                        results.people.forEach((v, k) => {
                            if (!v) {
                                failures.people.push({ k, v: mergedPeopleMap.get(k) });
                            }
                        });
                        results.tags.forEach((v, k) => {
                            if (!v) {
                                failures.tags.push({ k, v: mergedTagsMap.get(k) });
                            }
                        });
                        const failureCount =
                            failures.groups.length +
                            failures.exhibitions.length +
                            failures.originatingDatas.length +
                            failures.people.length +
                            failures.tags.length;
                        if (failureCount > 0) {
                            toast({
                                description: `${failureCount} failed to save.`,
                                isClosable: true,
                                status: "error",
                                title: "Failed to save one or more items",
                            });
                            console.log(failures);
                        } else {
                            toast({
                                isClosable: true,
                                status: "success",
                                title: "Changes saved",
                            });
                        }
                        setIsSaving(false);
                    }}
                    colorScheme="purple"
                >
                    Save merged data
                </Button>
            </Box>
        </>
    );
}
