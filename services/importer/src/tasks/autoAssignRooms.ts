import { gqlClient } from "@midspace/component-clients/graphqlClient";
import type { Session } from "@midspace/shared-types/import/program";
import { gql } from "@urql/core";
import * as R from "ramda";
import {
    FindExistingDefaultRoomsDocument,
    FindExistingDefaultRoomsQuery,
    FindExistingDefaultRoomsQueryVariables,
} from "../generated/graphql";
import { logger } from "../logger";
import { publishTask } from "../rabbitmq/tasks";
import { getJob, updateJob } from "./lib/job";

gql`
    query FindExistingDefaultRooms($where: room_Room_bool_exp!) {
        room_Room(where: $where) {
            id
            name
        }
    }
`;

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

    const existingDefaultRooms = await gqlClient
        ?.query<FindExistingDefaultRoomsQuery, FindExistingDefaultRoomsQueryVariables>(
            FindExistingDefaultRoomsDocument,
            {
                where: {
                    conferenceId: { _eq: job.conferenceId },
                    subconferenceId: job.subconferenceId ? { _eq: job.subconferenceId } : { _is_null: true },
                    name: { _like: "Auditorium %" },
                },
            }
        )
        .toPromise();
    if (!existingDefaultRooms?.data) {
        throw new Error("Unable to retrieve existing default rooms.");
    }
    const defaultRoomMaxNumber =
        R.last(
            R.sortBy<number>(
                (x) => x,
                R.map(
                    (x) => parseInt(R.last(x.name.split(" ")) ?? "Impossible", 10),
                    existingDefaultRooms.data.room_Room
                )
            )
        ) ?? 0;

    const sessions = job.data.flatMap<Session>((x) => x.data.sessions);
    logger.trace("Sorting sessions");
    const sortedSessions = R.sortWith<Session>(
        [
            (x, y) => toMilliseconds(x.event.start) - toMilliseconds(y.event.start),
            (x, y) => y.event.duration - x.event.duration,
        ],
        sessions.filter((x) => hasNoAssignedRoomOrIsDefaultRoom(x))
    );

    if (sortedSessions.length > 0) {
        let roomNumber = defaultRoomMaxNumber + 1;

        logger.info({ sortedSessions }, "Assigning rooms to sessions");
        let end = toMilliseconds(sortedSessions[0].event.start) + sortedSessions[0].event.duration * 60 * 1000;

        sortedSessions[0].event.roomName = `Auditorium ${roomNumber}`;

        for (let idx = 1; idx < sortedSessions.length; idx++) {
            const session = sortedSessions[idx];
            const start = toMilliseconds(session.event.start);
            if (start < end) {
                roomNumber++;
            } else {
                roomNumber = defaultRoomMaxNumber + 1;
            }
            session.event.roomName = `Auditorium ${roomNumber}`;
            end = Math.max(end, start + session.event.duration * 60 * 1000);
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

function hasNoAssignedRoomOrIsDefaultRoom(session: Session) {
    return !session.event.roomName || session.event.roomName.startsWith("Auditorium ");
}

function toMilliseconds(date: Date | string): number {
    logger.trace({ date, type: typeof date }, "toMilliseconds");
    if (date instanceof Date) {
        return date.getTime();
    }
    return Date.parse(date);
}
