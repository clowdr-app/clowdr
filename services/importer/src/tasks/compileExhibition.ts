import { logger } from "../logger";
import { publishTask } from "../rabbitmq/tasks";
import type { Entity } from "./lib/compile";
import { applyEntities, generateRootExhibitionEntities, mergeEntities, sortEntities } from "./lib/compile";
import { appendJobErrors, completeJob, getJob, updateJob } from "./lib/job";
import { generateExhibitionRootOutputName } from "./lib/names";

export async function compileExhibition(jobId: string, fileIndex: number, exhibitionIndex: number): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    let ok = false;

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
    const sortedEntities = sortEntities(mergedEntities);
    await applyEntities(sortedEntities, job);

    ok = true;

    if (!ok) {
        logger.info({ jobId, fileIndex, exhibitionIndex: exhibitionIndex }, "Failed to compile exhibition");
        await appendJobErrors(
            jobId,
            [
                {
                    message: `Failed to compile exhibition: File: ${fileIndex}, Exhibition: ${exhibitionIndex}`,
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
        if (job.progress + 1 >= sessionCount + exhibitionCount) {
            const progressMaximum = job.progressMaximum + sortedEntities.length - (sessionCount + exhibitionCount);
            if (progressMaximum === 0) {
                await completeJob(jobId);
            } else {
                await publishTask({
                    type: "complete",
                    jobId,
                });
                await updateJob(jobId, {
                    status: "apply_changes",
                    progress: 0,
                    progressMaximum,
                });
            }
        }
    }

    return true;
}
