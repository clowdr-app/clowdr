import type { ConsumeMessage } from "amqplib";
import { logger } from "../logger";
import { onTask, onTasksComplete, onTasksFail } from "../rabbitmq/tasks";
import { applyTask } from "../tasks/apply";
import { autoAssignRoomsTask } from "../tasks/autoAssignRooms";
import { compileExhibition } from "../tasks/compileExhibition";
import { compileSession } from "../tasks/compileSession";
import { completeTask } from "../tasks/complete";
import { initializeTask } from "../tasks/initialize";
import { queueExhibitions } from "../tasks/queueExhibitions";
import { queueSessions } from "../tasks/queueSessions";
import type { Task } from "../types/task";

async function processTask(rabbitMQMsg: ConsumeMessage, task: Task) {
    logger.info({ task }, "Executing task");

    try {
        let ok = false;
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
                break;
            case "complete":
                ok = await completeTask(task.jobId);
                break;
        }

        if (ok) {
            await onTasksComplete([rabbitMQMsg]);
        } else {
            logger.error({ task }, "Unknown failure processing task");
            await onTasksFail([rabbitMQMsg]);
        }
    } catch (error: any) {
        logger.error({ error, errorString: error?.toString(), task }, "Error processing task");

        await onTasksFail([rabbitMQMsg]);
    }
}

async function Main() {
    onTask(processTask);
}

Main();
