import type { Channel, ConsumeMessage } from "amqplib";
import * as R from "ramda";
import { logger } from "../logger";
import { onTasksComplete, onTasksFail } from "../rabbitmq/tasks";
import { applyTask } from "../tasks/apply";
import { autoAssignRoomsTask } from "../tasks/autoAssignRooms";
import { compileExhibition } from "../tasks/compileExhibition";
import { compileSession } from "../tasks/compileSession";
import { initializeTask } from "../tasks/initialize";
import { applyEntities } from "../tasks/lib/compile";
import { queueExhibitions } from "../tasks/queueExhibitions";
import { queueSessions } from "../tasks/queueSessions";
import type { Task } from "../types/task";

export async function processTask(rabbitMQMsg: ConsumeMessage, task: Task, channel: Channel) {
    logger.info({ task: { type: task.type, jobId: task.jobId } }, "Executing task");

    try {
        let ok = false;
        let error: string | undefined;
        switch (task.type) {
            case "initialize":
                ok = await initializeTask(task.jobId);
                break;
            case "assign_rooms":
                ok = await autoAssignRoomsTask(task.jobId);
                break;
            case "queue_sessions":
                ok = await queueSessions(task.jobId);
                break;
            case "queue_exhibitions":
                ok = await queueExhibitions(task.jobId);
                break;
            case "compile_session":
                ok = await compileSession(task.jobId, task.fileIndex, task.sessionIndex);
                break;
            case "compile_exhibition":
                ok = await compileExhibition(task.jobId, task.fileIndex, task.exhibitionIndex);
                break;
            case "apply":
                ok = await applyTask(task.jobId, task.data);

                if (ok && task.followOn) {
                    const results = await applyEntities(task.followOn, task.jobId);
                    ok = R.all((x) => x, results.results);
                    error = "Failed to apply follow-on entities";
                }
                break;
        }

        if (ok) {
            await onTasksComplete([rabbitMQMsg], channel);
        } else {
            logger.error({ task }, error ?? "Unknown failure processing task");
            await onTasksFail([rabbitMQMsg], channel);
        }
    } catch (error: any) {
        logger.error({ error, errorString: error?.toString(), task }, "Error processing task");

        await onTasksFail([rabbitMQMsg], channel);
    }
}
