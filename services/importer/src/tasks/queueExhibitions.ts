import { logger } from "../logger";
import { publishTask } from "../rabbitmq/tasks";
import { appendJobErrors, getJob, increaseJobProgress, increaseJobProgressMaximum } from "./lib/job";

export async function queueExhibitions(jobId: string): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    let ok = true;
    const exhibitionCount = job.data.reduce((acc, file) => acc + file.data.exhibitions.length, 0);

    if (exhibitionCount > 0) {
        await increaseJobProgressMaximum(jobId, "queue_exhibitions", exhibitionCount);

        for (let fileIndex = 0; fileIndex < job.data.length; fileIndex++) {
            const file = job.data[fileIndex];
            for (let offset = 0; offset < file.data.exhibitions.length; offset += 100) {
                const taskCount = Math.min(100, file.data.exhibitions.length - offset);
                const promises: Promise<boolean>[] = new Array(taskCount);
                for (let idx = 0; idx < taskCount; idx++) {
                    promises[idx] = (async () => {
                        try {
                            const r = await publishTask({
                                type: "compile_exhibition",
                                fileIndex,
                                exhibitionIndex: offset + idx,
                                jobId,
                            });

                            if (!r) {
                                logger.info(
                                    { jobId, index: offset + idx },
                                    "Failed to publish compile exhibition task"
                                );
                            }

                            return r;
                        } catch (e) {
                            logger.info({ jobId, index: offset + idx }, "Failed to publish compile exhibition task");
                        }

                        return false;
                    })();
                }
                const allOk = (await Promise.all(promises)).every((x) => x);
                ok = ok && allOk;
            }
        }
    }

    if (!ok) {
        logger.info({ jobId }, "Failed to publish one or more compile exhibition tasks");
        await appendJobErrors(
            jobId,
            [
                {
                    message: "Failed to queue one or more exhibitions",
                },
            ],
            true
        );
    }

    await increaseJobProgress(jobId, "queue_exhibitions", 1);

    return true;
}
