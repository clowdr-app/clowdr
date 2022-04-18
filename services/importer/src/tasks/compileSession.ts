/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { logger } from "../logger";
import type { Entity } from "./lib/compile";
import { applyEntities, generateSessionEntities, mergeEntities, sortEntities } from "./lib/compile";
import { appendJobErrors, getJob, increaseJobProgressAndProgressMaximum, updateJob } from "./lib/job";
import { generateSessionRootOutputName } from "./lib/names";

export async function compileSession(jobId: string, fileIndex: number, sessionIndex: number): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    await updateJob(jobId, { status: "compile_session" });

    let ok = false;
    let errorMsg = "";

    let sortedEntities: Entity[] = [];
    let appliedCount = 0;
    try {
        const entities = generateSessionEntities(
            job.data[fileIndex].data.sessions[sessionIndex],
            generateSessionRootOutputName(fileIndex, sessionIndex),
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

    await increaseJobProgressAndProgressMaximum(jobId, "compile_session", 1, sortedEntities.length);

    if (!ok) {
        logger.info({ jobId, fileIndex, sessionIndex }, "Failed to compile session");
        await appendJobErrors(
            jobId,
            [
                {
                    message: `Failed to compile session: File: ${fileIndex}, Session: ${sessionIndex}.\n\n${errorMsg}`,
                },
            ],
            true
        );
    }

    return true;
}
