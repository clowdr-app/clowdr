import type { Session } from "@midspace/shared-types/import/program";
import * as R from "ramda";
import { logger } from "../logger";
import { publishTask } from "../rabbitmq/tasks";
import type { ParsedData } from "../types/job";
import { getJob, updateJob } from "./lib/job";

export async function autoAssignRoomsTask(jobId: string): Promise<boolean> {
    const job = await getJob(jobId);
    if (job.completed_at) {
        // Ignore completed jobs
        return true;
    }

    const progressMaximum = job.data.reduce((acc, file) => acc + file.data.sessions.length, 0);
    await updateJob(jobId, {
        status: "assign_rooms",
        progress: 0,
        progressMaximum,
    });

    let roomNumber = 1;
    for (let fileIdx = 0; fileIdx < job.data.length; fileIdx++) {
        const file = job.data[fileIdx];

        logger.trace({ fileIdx, sessions: file.data.sessions }, "Determining if sessions overlap");
        const overlaps = anyOverlapsInSessionsWithNoAssignedRoomOrDefaultRoom(file, fileIdx);

        for (let sessionIdx = 0; sessionIdx < file.data.sessions.length; sessionIdx++) {
            const session = file.data.sessions[sessionIdx];

            logger.trace({ session, sessionIdx, fileIdx }, "Assigning room for session");
            if (hasNoAssignedRoomOrIsDefaultRoom(session, fileIdx, sessionIdx)) {
                session.event.roomName = overlaps
                    ? generateDefaultRoomName(session, fileIdx, sessionIdx)
                    : `Auditorium ${roomNumber}`;
            }
        }

        if (overlaps) {
            roomNumber++;
        }
    }

    await updateJob(jobId, {
        data: job.data,
        progress: progressMaximum,
    });

    await publishTask({
        type: "queue_sessions",
        jobId,
    });
    await publishTask({
        type: "queue_exhibitions",
        jobId,
    });

    return true;
}

function hasNoAssignedRoomOrIsDefaultRoom(session: Session, fileIndex: number, sessionIndex: number) {
    logger.trace({ session, fileIndex, sessionIndex }, "hasNoAssignedRoomOrIsDefaultRoom");
    return (
        !session.event.roomName || session.event.roomName === generateDefaultRoomName(session, fileIndex, sessionIndex)
    );
}

function generateDefaultRoomName(session: Session, fileIndex: number, sessionIndex: number): string {
    logger.trace({ session, fileIndex, sessionIndex }, "generateDefaultRoomName");
    return session.content.title ?? `No title [File: ${fileIndex}, Session: ${sessionIndex}]`;
}

function toMilliseconds(date: Date | string): number {
    logger.trace({ date, type: typeof date }, "toMilliseconds");
    if (date instanceof Date) {
        return date.getTime();
    }
    return Date.parse(date);
}

function anyOverlapsInSessionsWithNoAssignedRoomOrDefaultRoom(file: ParsedData, fileIndex: number): boolean {
    logger.trace("Sorting sessions");
    const sortedSessions = R.sortWith<Session>(
        [
            (x, y) => toMilliseconds(x.event.start) - toMilliseconds(y.event.start),
            (x, y) => y.event.duration - x.event.duration,
        ],
        file.data.sessions.filter((x, idx) => hasNoAssignedRoomOrIsDefaultRoom(x, fileIndex, idx))
    );

    if (sortedSessions.length === 0) {
        return false;
    }

    logger.info({ sortedSessions }, "Checking sessions");
    let end = toMilliseconds(sortedSessions[0].event.start) + sortedSessions[0].event.duration * 60 * 1000;
    for (let idx = 1; idx < sortedSessions.length; idx++) {
        const session = sortedSessions[idx];
        const start = toMilliseconds(session.event.start);
        if (start < end) {
            return true;
        }
        end = Math.max(end, start + session.event.duration * 60 * 1000);
    }
    return false;
}
