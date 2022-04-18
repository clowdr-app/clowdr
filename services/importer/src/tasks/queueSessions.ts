import { logger } from "../logger";
import { publishTask } from "../rabbitmq/tasks";
import { appendJobErrors, getJob, increaseJobProgress, increaseJobProgressMaximum } from "./lib/job";

export async function queueSessions(jobId: string): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    let ok = true;
    const sessionCount = job.data.reduce((acc, file) => acc + file.data.sessions.length, 0);

    if (sessionCount > 0) {
        await increaseJobProgressMaximum(jobId, "queue_sessions", sessionCount);

        for (let fileIndex = 0; fileIndex < job.data.length; fileIndex++) {
            const file = job.data[fileIndex];
            for (let offset = 0; offset < file.data.sessions.length; offset += 100) {
                const taskCount = Math.min(100, file.data.sessions.length - offset);
                const promises: Promise<boolean>[] = new Array(taskCount);
                for (let idx = 0; idx < taskCount; idx++) {
                    promises[idx] = (async () => {
                        try {
                            const r = await publishTask({
                                type: "compile_session",
                                fileIndex,
                                sessionIndex: offset + idx,
                                jobId,
                            });

                            if (!r) {
                                logger.info({ jobId, index: offset + idx }, "Failed to publish compile session task");
                            }

                            return r;
                        } catch (e) {
                            logger.info({ jobId, index: offset + idx }, "Failed to publish compile session task");
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
        logger.info({ jobId }, "Failed to publish one or more compile session tasks");
        await appendJobErrors(
            jobId,
            [
                {
                    message: "Failed to queue one or more sessions",
                },
            ],
            true
        );
    }

    await increaseJobProgress(jobId, "queue_sessions", 1);

    return true;
}
