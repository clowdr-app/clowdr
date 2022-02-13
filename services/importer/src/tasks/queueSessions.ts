import { logger } from "../logger";
import { publishTask } from "../rabbitmq/tasks";
import { appendJobErrors, getJob, increaseJobProgress, updateJob } from "./lib/job";

export async function queueSessions(jobId: string): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    await updateJob(jobId, {
        status: "queue_sessions",
        progress: 0,
        progressMaximum: job.data.reduce((acc, file) => acc + file.data.sessions.length, 0),
    });

    let ok = true;
    for (let fileIndex = 0; fileIndex < job.data.length; fileIndex++) {
        const file = job.data[fileIndex];

        for (let offset = 0; ok && offset < file.data.sessions.length; offset += 100) {
            const taskCount = Math.min(100, file.data.sessions.length - offset);
            const promises: Promise<boolean>[] = new Array(taskCount);
            for (let idx = 0; ok && idx < taskCount; idx++) {
                promises[idx] = (async () => {
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
                })();
            }
            const allOk = (await Promise.all(promises)).every((x) => x);
            ok = ok && allOk;

            await increaseJobProgress(jobId, taskCount);
        }

        if (!ok) {
            break;
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

    return true;
}
