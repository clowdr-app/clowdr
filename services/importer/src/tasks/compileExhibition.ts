import { logger } from "../logger";
import type { Entity } from "./lib/compile";
import { applyEntities, generateRootExhibitionEntities, mergeEntities, sortEntities } from "./lib/compile";
import { appendJobErrors, getJob, increaseJobProgressAndProgressMaximum, updateJob } from "./lib/job";
import { generateExhibitionRootOutputName } from "./lib/names";

export async function compileExhibition(jobId: string, fileIndex: number, exhibitionIndex: number): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    await updateJob(jobId, { status: "compile_exhibition" });

    let ok = false;
    let errorMsg = "";

    let sortedEntities: Entity[] = [];
    let appliedCount = 0;
    try {
        const entities = generateRootExhibitionEntities(
            job.data[fileIndex].data.exhibitions[exhibitionIndex],
            generateExhibitionRootOutputName(fileIndex, exhibitionIndex),
            job.options,
            {
                conferenceId: job.conferenceId,
                subconferenceId: job.subconferenceId,
                createdBy: job.createdBy ?? undefined,
                createdByLabel: "importer:" + (job.createdBy ?? "unknown"),
            }
        ).filter((x) => x.__typename);
        const mergedEntities: Entity[] = mergeEntities(entities);
        sortedEntities = sortEntities(mergedEntities);
        const results = await applyEntities(sortedEntities, jobId);
        appliedCount = results.results.reduce((acc, x) => (x ? acc + 1 : acc), 0);

        ok = appliedCount === results.expected;
        errorMsg = !ok ? "Failed to publish apply tasks for one or more entities." : "";
    } catch (e: any) {
        ok = false;
        errorMsg = e.message ?? e.toString();
    }

    await increaseJobProgressAndProgressMaximum(jobId, "compile_exhibition", 1, sortedEntities.length);

    if (!ok) {
        logger.info({ jobId, fileIndex, exhibitionIndex }, "Failed to compile exhibition");
        await appendJobErrors(
            jobId,
            [
                {
                    message: `Failed to compile exhibition: File: ${fileIndex}, Exhibition: ${exhibitionIndex}.\n\n${errorMsg}`,
                },
            ],
            true
        );
    }

    return true;
}
