/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { logger } from "../logger";
import { publishTask } from "../rabbitmq/tasks";
import type { Entity } from "./lib/compile";
import { applyEntities, generateSessionEntities, mergeEntities, sortEntities } from "./lib/compile";
import { appendJobErrors, completeJob, getJob, updateJob } from "./lib/job";
import { generateSessionRootOutputName } from "./lib/names";

export async function compileSession(jobId: string, fileIndex: number, sessionIndex: number): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    let ok = false;
    let errorMsg = "";

    let sortedEntities: Entity[] = [];
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
        await applyEntities(sortedEntities, job);

        ok = true;
    } catch (e: any) {
        ok = false;
        errorMsg = e.message ?? e.toString();
    }

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
    } else {
        const sessionCount = job.data.reduce((acc, file) => acc + file.data.sessions.length, 0);
        const exhibitionCount = job.data.reduce((acc, file) => acc + file.data.exhibitions.length, 0);

        await updateJob(jobId, {
            progress: job.progress + 1,
            progressMaximum: job.progressMaximum + sortedEntities.length,
        });
        if (job.progress + 1 >= sessionCount) {
            if (job.data.some((file) => file.data.exhibitions.length > 0)) {
                await updateJob(jobId, {
                    status: "compile_exhibitions",
                });
            } else {
                const progressMaximum = job.progressMaximum + sortedEntities.length - (sessionCount + exhibitionCount);
                if (progressMaximum === 0) {
                    await completeJob(jobId);
                } else {
                    await publishTask({
                        type: "complete",
                        jobId,
                    });
                    await updateJob(jobId, {
                        status: "inserts_and_updates",
                        progress: 0,
                        progressMaximum,
                    });
                }
            }
        }
    }

    return true;
}
