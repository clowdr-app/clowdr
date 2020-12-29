import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    Spinner,
    useToast,
} from "@chakra-ui/react";
import type { IntermediaryData } from "@clowdr-app/shared-types/build/import/intermediary";
import assert from "assert";
import React, { useEffect, useState } from "react";
import JSONataQueryModal from "../../../../Files/JSONataQueryModal";
import FAIcon from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
import type {
    ContentGroupDescriptor,
    ContentPersonDescriptor,
    HallwayDescriptor,
    TagDescriptor,
} from "../../Content/Types";
import { useSaveContentDiff } from "../../Content/useSaveContentDiff";
import type { OriginatingDataDescriptor } from "../../Shared/Types";
import { ChangeSummary, Set_toJSON } from "../Merge";
import mergeContent from "./MergeContent";

export default function MergePanel({ data }: { data: Record<string, IntermediaryData> }): JSX.Element {
    const conference = useConference();
    const saveContentDiff = useSaveContentDiff();
    const {
        errorContent,
        loadingContent,
        originalContentGroups,
        originalHallways,
        originalOriginatingDatas,
        originalPeople,
        originalTags,
    } = saveContentDiff;

    const [mergedGroupsMap, setMergedContentGroupsMap] = useState<Map<string, ContentGroupDescriptor>>();
    const [mergedPeopleMap, setMergedPeopleMap] = useState<Map<string, ContentPersonDescriptor>>();
    const [mergedHallwaysMap, setMergedHallwaysMap] = useState<Map<string, HallwayDescriptor>>();
    const [mergedTagsMap, setMergedTagsMap] = useState<Map<string, TagDescriptor>>();
    const [mergedOriginatingDatasMap, setMergedOriginatingDatasMap] = useState<
        Map<string, OriginatingDataDescriptor>
    >();
    const [changes, setChanges] = useState<ChangeSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (originalContentGroups && originalHallways && originalOriginatingDatas && originalPeople && originalTags) {
            try {
                setError(null);
                const merged = mergeContent(
                    conference.id,
                    data,
                    originalContentGroups,
                    originalHallways,
                    originalOriginatingDatas,
                    originalPeople,
                    originalTags
                );
                setMergedContentGroupsMap(merged.newContentGroups);
                setMergedPeopleMap(merged.newPeople);
                setMergedHallwaysMap(merged.newHallways);
                setMergedTagsMap(merged.newTags);
                setMergedOriginatingDatasMap(merged.newOriginatingDatas);
                setChanges(merged.changes);
                console.log("Merged", merged);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                window.merged = merged;
            } catch (e) {
                setMergedContentGroupsMap(originalContentGroups);
                setMergedPeopleMap(originalPeople);
                setMergedHallwaysMap(originalHallways);
                setMergedTagsMap(originalTags);
                setMergedOriginatingDatasMap(originalOriginatingDatas);
                setChanges([]);
                setError(e.message);
            }
        }
    }, [
        conference.id,
        data,
        originalContentGroups,
        originalHallways,
        originalOriginatingDatas,
        originalPeople,
        originalTags,
    ]);

    const finalData = {
        groups: Array.from(mergedGroupsMap?.values() ?? []),
        people: Array.from(mergedPeopleMap?.values() ?? []),
        hallways: Array.from(mergedHallwaysMap?.values() ?? []),
        tags: Array.from(mergedTagsMap?.values() ?? []),
        originatingDatas: Array.from(mergedOriginatingDatasMap?.values() ?? []),
    };

    const toast = useToast();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    return loadingContent &&
        (!mergedGroupsMap || !mergedTagsMap || !mergedPeopleMap || !mergedOriginatingDatasMap || !mergedHallwaysMap) ? (
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
                            !mergedHallwaysMap ||
                            !mergedTagsMap ||
                            !mergedOriginatingDatasMap
                        ) || isSaving
                    }
                    isLoading={isSaving}
                    onClick={async () => {
                        setIsSaving(true);
                        assert(saveContentDiff.originalContentGroups);
                        assert(mergedGroupsMap);
                        assert(mergedPeopleMap);
                        assert(mergedHallwaysMap);
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
                                hallwayKeys: new Set(mergedHallwaysMap.keys()),
                                originatingDataKeys: newOriginatingDataKeys,
                                peopleKeys: new Set(mergedPeopleMap.keys()),
                                tagKeys: new Set(mergedTagsMap.keys()),
                            },
                            mergedTagsMap,
                            mergedPeopleMap,
                            mergedOriginatingDatasMap,
                            mergedGroupsMap,
                            mergedHallwaysMap
                        );

                        const failures: { [K: string]: string[] } = {
                            groups: [],
                            hallways: [],
                            originatingDatas: [],
                            people: [],
                            tags: [],
                        };
                        results.groups.forEach((v, k) => {
                            if (!v) {
                                failures.groups.push(k);
                            }
                        });
                        results.hallways.forEach((v, k) => {
                            if (!v) {
                                failures.hallways.push(k);
                            }
                        });
                        results.originatingDatas.forEach((v, k) => {
                            if (!v) {
                                failures.originatingDatas.push(k);
                            }
                        });
                        results.people.forEach((v, k) => {
                            if (!v) {
                                failures.people.push(k);
                            }
                        });
                        results.tags.forEach((v, k) => {
                            if (!v) {
                                failures.tags.push(k);
                            }
                        });
                        const failureCount =
                            failures.groups.length +
                            failures.hallways.length +
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
                    colorScheme="green"
                >
                    Save merged data
                </Button>
            </Box>
        </>
    );
}
