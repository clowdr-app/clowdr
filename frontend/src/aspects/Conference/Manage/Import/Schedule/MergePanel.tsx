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
import type { IntermediaryContentData } from "@clowdr-app/shared-types/build/import/intermediary";
import assert from "assert";
import React, { useEffect, useState } from "react";
import JSONataQueryModal from "../../../../Files/JSONataQueryModal";
import FAIcon from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
import type { EventDescriptor, RoomDescriptor } from "../../Schedule/Types";
import { useSaveScheduleDiff } from "../../Schedule/useSaveScheduleDiff";
import type { OriginatingDataDescriptor, TagDescriptor } from "../../Shared/Types";
import { ChangeSummary, Set_toJSON } from "../Merge";
import mergeSchedule from "./MergeSchedule";

export default function MergePanel({ data }: { data: Record<string, IntermediaryContentData> }): JSX.Element {
    const conference = useConference();
    const saveContentDiff = useSaveScheduleDiff();
    const {
        errorContent,
        loadingContent,
        contentGroups,
        originalEvents,
        originalRooms,
        originalOriginatingDatas,
        originalTags,
    } = saveContentDiff;

    const [mergedEventsMap, setMergedEventsMap] = useState<Map<string, EventDescriptor>>();
    const [mergedRoomsMap, setMergedRoomsMap] = useState<Map<string, RoomDescriptor>>();
    const [mergedTagsMap, setMergedTagsMap] = useState<Map<string, TagDescriptor>>();
    const [mergedOriginatingDatasMap, setMergedOriginatingDatasMap] = useState<
        Map<string, OriginatingDataDescriptor>
    >();
    const [changes, setChanges] = useState<ChangeSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (contentGroups && originalEvents && originalRooms && originalOriginatingDatas && originalTags) {
            try {
                setError(null);
                const merged = mergeSchedule(
                    conference.id,
                    data,
                    originalEvents,
                    originalRooms,
                    originalOriginatingDatas,
                    originalTags,
                    contentGroups
                );
                setMergedEventsMap(merged.newEvents);
                setMergedRoomsMap(merged.newRooms);
                setMergedTagsMap(merged.newTags);
                setMergedOriginatingDatasMap(merged.newOriginatingDatas);
                setChanges(merged.changes);
                console.log("Merged", merged);
            } catch (e) {
                setMergedEventsMap(originalEvents);
                setMergedRoomsMap(originalRooms);
                setMergedTagsMap(originalTags);
                setMergedOriginatingDatasMap(originalOriginatingDatas);
                setChanges([]);
                setError(e.message);
            }
        }
    }, [conference.id, data, originalEvents, originalRooms, originalOriginatingDatas, originalTags, contentGroups]);

    const finalData = {
        events: Array.from(mergedEventsMap?.values() ?? []),
        rooms: Array.from(mergedRoomsMap?.values() ?? []),
        tags: Array.from(mergedTagsMap?.values() ?? []),
        originatingDatas: Array.from(mergedOriginatingDatasMap?.values() ?? []),
    };

    const toast = useToast();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    return loadingContent && (!mergedEventsMap || !mergedTagsMap || !mergedOriginatingDatasMap || !mergedRoomsMap) ? (
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
                            !mergedEventsMap ||
                            !mergedRoomsMap ||
                            !mergedTagsMap ||
                            !mergedOriginatingDatasMap
                        ) || isSaving
                    }
                    isLoading={isSaving}
                    onClick={async () => {
                        setIsSaving(true);
                        assert(saveContentDiff.originalEvents);
                        assert(mergedEventsMap);
                        assert(mergedRoomsMap);
                        assert(mergedTagsMap);
                        assert(mergedOriginatingDatasMap);
                        const newOriginatingDataKeys = new Set(
                            Array.from(mergedOriginatingDatasMap.values())
                                .filter((x) => x.isNew)
                                .map((x) => x.id)
                        );
                        const results = await saveContentDiff.saveScheduleDiff(
                            {
                                eventKeys: new Set(mergedEventsMap.keys()),
                                roomKeys: new Set(mergedRoomsMap.keys()),
                                originatingDataKeys: newOriginatingDataKeys,
                                tagKeys: new Set(mergedTagsMap.keys()),
                            },
                            mergedTagsMap,
                            mergedOriginatingDatasMap,
                            mergedEventsMap,
                            mergedRoomsMap
                        );

                        const failures: { [K: string]: { k: string; v: any }[] } = {
                            events: [],
                            rooms: [],
                            originatingDatas: [],
                            tags: [],
                        };
                        results.events.forEach((v, k) => {
                            if (!v) {
                                failures.events.push({ k, v: mergedEventsMap.get(k) });
                            }
                        });
                        results.rooms.forEach((v, k) => {
                            if (!v) {
                                failures.rooms.push({ k, v: mergedRoomsMap.get(k) });
                            }
                        });
                        results.originatingDatas.forEach((v, k) => {
                            if (!v) {
                                failures.originatingDatas.push({ k, v: mergedOriginatingDatasMap.get(k) });
                            }
                        });
                        results.tags.forEach((v, k) => {
                            if (!v) {
                                failures.tags.push({ k, v: mergedTagsMap.get(k) });
                            }
                        });
                        const failureCount =
                            failures.events.length +
                            failures.rooms.length +
                            failures.originatingDatas.length +
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
