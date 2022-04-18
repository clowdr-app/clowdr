/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    ExistingCollection_ExhibitionQuery,
    ExistingCollection_ExhibitionQueryVariables,
    ExistingCollection_ProgramPersonQuery,
    ExistingCollection_ProgramPersonQueryVariables,
    ExistingCollection_TagQuery,
    ExistingCollection_TagQueryVariables,
    ExistingContent_ElementQuery,
    ExistingContent_ElementQueryVariables,
    ExistingContent_ItemExhibitionQuery,
    ExistingContent_ItemExhibitionQueryVariables,
    ExistingContent_ItemProgramPersonQuery,
    ExistingContent_ItemProgramPersonQueryVariables,
    ExistingContent_ItemQuery,
    ExistingContent_ItemQueryVariables,
    ExistingContent_ItemTagQuery,
    ExistingContent_ItemTagQueryVariables,
    ExistingRoom_RoomQuery,
    ExistingRoom_RoomQueryVariables,
    ExistingRoom_ShufflePeriodQuery,
    ExistingRoom_ShufflePeriodQueryVariables,
    ExistingSchedule_EventProgramPersonQuery,
    ExistingSchedule_EventProgramPersonQueryVariables,
    ExistingSchedule_EventQuery,
    ExistingSchedule_EventQueryVariables,
} from "../../generated/graphql";
import {
    ExistingCollection_ExhibitionDocument,
    ExistingCollection_ProgramPersonDocument,
    ExistingCollection_TagDocument,
    ExistingContent_ElementDocument,
    ExistingContent_ItemDocument,
    ExistingContent_ItemExhibitionDocument,
    ExistingContent_ItemProgramPersonDocument,
    ExistingContent_ItemTagDocument,
    ExistingRoom_RoomDocument,
    ExistingRoom_ShufflePeriodDocument,
    ExistingSchedule_EventDocument,
    ExistingSchedule_EventProgramPersonDocument,
} from "../../generated/graphql";
import type { InsertData, UpdateData } from "../../types/task";

gql`
    query ExistingRoom_Room($where: room_Room_bool_exp!) {
        existing: room_Room(where: $where) {
            id
            name
            itemId
            managementModeName
        }
    }

    query ExistingRoom_ShufflePeriod($where: room_ShufflePeriod_bool_exp!) {
        existing: room_ShufflePeriod(where: $where) {
            id
            startAt
            endAt
            maxRegistrantsPerRoom
            name
            organiserId
            roomDurationMinutes
            targetRegistrantsPerRoom
            waitRoomMaxDurationSeconds
        }
    }

    query ExistingCollection_Exhibition($where: collection_Exhibition_bool_exp!) {
        existing: collection_Exhibition(where: $where) {
            id
            descriptiveItemId
            isHidden
            name
        }
    }

    query ExistingCollection_ProgramPerson($where: collection_ProgramPerson_bool_exp!) {
        existing: collection_ProgramPerson(where: $where) {
            id
            name
            affiliation
            email
        }
    }

    query ExistingCollection_Tag($where: collection_Tag_bool_exp!) {
        existing: collection_Tag(where: $where) {
            id
            name
        }
    }

    query ExistingContent_Item($where: content_Item_bool_exp!) {
        existing: content_Item(where: $where) {
            id
            title
            typeName
        }
    }

    query ExistingContent_ItemProgramPerson($where: content_ItemProgramPerson_bool_exp!) {
        existing: content_ItemProgramPerson(where: $where) {
            id
            itemId
            personId
            priority
            roleName
        }
    }

    query ExistingContent_ItemTag($where: content_ItemTag_bool_exp!) {
        existing: content_ItemTag(where: $where) {
            id
            itemId
            tagId
        }
    }

    query ExistingContent_ItemExhibition($where: content_ItemExhibition_bool_exp!) {
        existing: content_ItemExhibition(where: $where) {
            id
            itemId
            exhibitionId
            priority
        }
    }

    query ExistingContent_Element($where: content_Element_bool_exp!) {
        existing: content_Element(where: $where) {
            id
            itemId
            name
            typeName
        }
    }

    query ExistingSchedule_Event($where: schedule_Event_bool_exp!) {
        existing: schedule_Event(where: $where) {
            id
            name
            scheduledStartTime
            scheduledEndTime

            enableRecording
            exhibitionId
            modeName
            itemId
            roomId
            shufflePeriodId
        }
    }

    query ExistingSchedule_Continuation($where: schedule_Continuation_bool_exp!) {
        existing: schedule_Continuation(where: $where) {
            id
        }
    }

    query ExistingSchedule_EventProgramPerson($where: schedule_EventProgramPerson_bool_exp!) {
        existing: schedule_EventProgramPerson(where: $where) {
            id
            personId
            eventId
            roleName
        }
    }
`;

export async function entityExists(
    data: InsertData
): Promise<
    | { state: "exists_update_required"; data: UpdateData }
    | { state: "exists_update_not_required"; value: UpdateData["value"] }
    | { state: "does_not_exist" }
> {
    switch (data.type) {
        case "Room":
            {
                const response = await gqlClient
                    ?.query<ExistingRoom_RoomQuery, ExistingRoom_RoomQueryVariables>(ExistingRoom_RoomDocument, {
                        where: {
                            conferenceId: { _eq: data.value.conferenceId },
                            subconferenceId: data.value.subconferenceId
                                ? { _eq: data.value.subconferenceId }
                                : { _is_null: true },
                            name: { _eq: data.value.name },
                        },
                    })
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find(
                        (existing) =>
                            existing.itemId === data.value.itemId &&
                            existing.managementModeName === data.value.managementModeName
                    );
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    } else if (allExisting.length === 1) {
                        return {
                            state: "exists_update_required",
                            data: {
                                outputs: data.outputs,
                                remapColumns: data.remapColumns,
                                type: "Room",
                                value: {
                                    id: allExisting[0].id,
                                    itemId: data.value.itemId ?? null,
                                    managementModeName: data.value.managementModeName,
                                },
                            },
                        };
                    }
                }
            }
            break;
        case "ShufflePeriod":
            {
                const response = await gqlClient
                    ?.query<ExistingRoom_ShufflePeriodQuery, ExistingRoom_ShufflePeriodQueryVariables>(
                        ExistingRoom_ShufflePeriodDocument,
                        {
                            where: {
                                conferenceId: { _eq: data.value.conferenceId },
                                subconferenceId: data.value.subconferenceId
                                    ? { _eq: data.value.subconferenceId }
                                    : { _is_null: true },
                                name: { _eq: data.value.name },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find(
                        (existing) =>
                            Date.parse(existing.endAt) === Date.parse(data.value.endAt) &&
                            Date.parse(existing.startAt) === Date.parse(data.value.startAt)
                    );
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    } else if (allExisting.length === 1) {
                        return {
                            state: "exists_update_required",
                            data: {
                                outputs: data.outputs,
                                remapColumns: data.remapColumns,
                                type: "ShufflePeriod",
                                value: {
                                    id: allExisting[0].id,
                                    endAt: data.value.endAt,
                                    maxRegistrantsPerRoom: data.value.maxRegistrantsPerRoom,
                                    roomDurationMinutes: data.value.roomDurationMinutes,
                                    startAt: data.value.startAt,
                                    targetRegistrantsPerRoom: data.value.targetRegistrantsPerRoom,
                                    waitRoomMaxDurationSeconds: data.value.waitRoomMaxDurationSeconds,
                                },
                            },
                        };
                    }
                }
            }
            break;
        case "Exhibition":
            {
                const response = await gqlClient
                    ?.query<ExistingCollection_ExhibitionQuery, ExistingCollection_ExhibitionQueryVariables>(
                        ExistingCollection_ExhibitionDocument,
                        {
                            where: {
                                conferenceId: { _eq: data.value.conferenceId },
                                subconferenceId: data.value.subconferenceId
                                    ? { _eq: data.value.subconferenceId }
                                    : { _is_null: true },
                                name: { _eq: data.value.name },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find(
                        (existing) =>
                            existing.descriptiveItemId === data.value.descriptiveItemId &&
                            existing.isHidden === data.value.isHidden
                    );
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    } else if (allExisting.length === 1) {
                        return {
                            state: "exists_update_required",
                            data: {
                                outputs: data.outputs,
                                remapColumns: data.remapColumns,
                                type: "Exhibition",
                                value: {
                                    id: allExisting[0].id,
                                    descriptiveItemId: data.value.descriptiveItemId ?? null,
                                    isHidden: data.value.isHidden,
                                },
                            },
                        };
                    }
                }
            }
            break;
        case "ProgramPerson":
            {
                const response = await gqlClient
                    ?.query<ExistingCollection_ProgramPersonQuery, ExistingCollection_ProgramPersonQueryVariables>(
                        ExistingCollection_ProgramPersonDocument,
                        {
                            where: {
                                conferenceId: { _eq: data.value.conferenceId },
                                subconferenceId: data.value.subconferenceId
                                    ? { _eq: data.value.subconferenceId }
                                    : { _is_null: true },
                                name: { _eq: data.value.name },
                                ...(data.value.affiliation
                                    ? {
                                          _or: [
                                              {
                                                  affiliation: { _eq: data.value.affiliation },
                                              },
                                              {
                                                  affiliation: { _is_null: true },
                                              },
                                          ],
                                      }
                                    : {}),
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    // Prefer better matches
                    const matching = allExisting.find(
                        (existing) =>
                            existing.name === data.value.name &&
                            (existing.affiliation === data.value.affiliation ||
                                !existing.affiliation ||
                                !data.value.affiliation)
                    );
                    if (matching) {
                        if (
                            matching.name !== data.value.name ||
                            (data.value.affiliation && matching.affiliation !== data.value.affiliation) ||
                            (data.value.email && matching.email !== data.value.email)
                        ) {
                            return {
                                state: "exists_update_required",
                                data: {
                                    outputs: data.outputs,
                                    remapColumns: data.remapColumns,
                                    type: "ProgramPerson",
                                    value: {
                                        id: matching.id,
                                        affiliation: matching.affiliation,
                                        name: matching.name,
                                        email: matching.email,
                                    },
                                },
                            };
                        } else {
                            return {
                                state: "exists_update_not_required",
                                value: matching,
                            };
                        }
                    }

                    if (allExisting.length === 1) {
                        return {
                            state: "exists_update_required",
                            data: {
                                outputs: data.outputs,
                                remapColumns: data.remapColumns,
                                type: "ProgramPerson",
                                value: {
                                    id: allExisting[0].id,
                                    affiliation: allExisting[0].affiliation,
                                    name: allExisting[0].name,
                                    email: allExisting[0].email,
                                },
                            },
                        };
                    }
                }
            }
            break;
        case "Tag":
            {
                const response = await gqlClient
                    ?.query<ExistingCollection_TagQuery, ExistingCollection_TagQueryVariables>(
                        ExistingCollection_TagDocument,
                        {
                            where: {
                                conferenceId: { _eq: data.value.conferenceId },
                                subconferenceId: data.value.subconferenceId
                                    ? { _eq: data.value.subconferenceId }
                                    : { _is_null: true },
                                name: { _eq: data.value.name },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    return {
                        state: "exists_update_not_required",
                        value: allExisting[0],
                    };
                }
            }
            break;
        case "Item":
            {
                const response = await gqlClient
                    ?.query<ExistingContent_ItemQuery, ExistingContent_ItemQueryVariables>(
                        ExistingContent_ItemDocument,
                        {
                            where: {
                                conferenceId: { _eq: data.value.conferenceId },
                                subconferenceId: data.value.subconferenceId
                                    ? { _eq: data.value.subconferenceId }
                                    : { _is_null: true },
                                title: { _eq: data.value.title },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find((existing) => existing.typeName === data.value.typeName);
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    } else if (allExisting.length === 1) {
                        return {
                            state: "exists_update_required",
                            data: {
                                outputs: data.outputs,
                                remapColumns: data.remapColumns,
                                type: "Item",
                                value: {
                                    id: allExisting[0].id,
                                    typeName: data.value.typeName,
                                },
                            },
                        };
                    }
                }
            }
            break;
        case "ItemProgramPerson":
            {
                const response = await gqlClient
                    ?.query<ExistingContent_ItemProgramPersonQuery, ExistingContent_ItemProgramPersonQueryVariables>(
                        ExistingContent_ItemProgramPersonDocument,
                        {
                            where: {
                                itemId: { _eq: data.value.itemId },
                                personId: { _eq: data.value.personId },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find((existing) => existing.roleName === data.value.roleName);
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    } else if (allExisting.length === 1) {
                        return {
                            state: "exists_update_required",
                            data: {
                                outputs: data.outputs,
                                remapColumns: data.remapColumns,
                                type: "ItemProgramPerson",
                                value: {
                                    id: allExisting[0].id,
                                    roleName: data.value.roleName,
                                },
                            },
                        };
                    }
                }
            }
            break;
        case "ItemTag":
            {
                const response = await gqlClient
                    ?.query<ExistingContent_ItemTagQuery, ExistingContent_ItemTagQueryVariables>(
                        ExistingContent_ItemTagDocument,
                        {
                            where: {
                                itemId: { _eq: data.value.itemId },
                                tagId: { _eq: data.value.tagId },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    return {
                        state: "exists_update_not_required",
                        value: allExisting[0],
                    };
                }
            }
            break;
        case "ItemExhibition":
            {
                const response = await gqlClient
                    ?.query<ExistingContent_ItemExhibitionQuery, ExistingContent_ItemExhibitionQueryVariables>(
                        ExistingContent_ItemExhibitionDocument,
                        {
                            where: {
                                itemId: { _eq: data.value.itemId },
                                exhibitionId: { _eq: data.value.exhibitionId },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find((existing) => existing.priority === data.value.priority);
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    } else if (allExisting.length === 1) {
                        return {
                            state: "exists_update_not_required",
                            value: allExisting[0],
                        };
                    }
                }
            }
            break;
        case "Element":
            {
                const response = await gqlClient
                    ?.query<ExistingContent_ElementQuery, ExistingContent_ElementQueryVariables>(
                        ExistingContent_ElementDocument,
                        {
                            where: {
                                conferenceId: { _eq: data.value.conferenceId },
                                subconferenceId: data.value.subconferenceId
                                    ? { _eq: data.value.subconferenceId }
                                    : { _is_null: true },
                                itemId: { _eq: data.value.itemId },
                                name: { _eq: data.value.name },
                            },
                        }
                    )
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find((existing) => existing.typeName === data.value.typeName);
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    }
                    // We can't easily update an existing element if the type has changed
                    // due to the nested JSON data.
                }
            }
            break;
        case "Event":
            {
                const startTimeStr = data.value.scheduledStartTime
                    ? new Date(data.value.scheduledStartTime).toISOString()
                    : null;
                const endTimeStr = data.value.scheduledEndTime
                    ? new Date(data.value.scheduledEndTime).toISOString()
                    : null;
                if (startTimeStr && endTimeStr) {
                    const sessionEventId = data.value.sessionEventId;
                    const response = await gqlClient
                        ?.query<ExistingSchedule_EventQuery, ExistingSchedule_EventQueryVariables>(
                            ExistingSchedule_EventDocument,
                            {
                                where: {
                                    conferenceId: { _eq: data.value.conferenceId },
                                    subconferenceId: data.value.subconferenceId
                                        ? { _eq: data.value.subconferenceId }
                                        : { _is_null: true },
                                    sessionEventId: sessionEventId ? { _eq: sessionEventId } : { _is_null: true },

                                    _or: [
                                        // Matching events
                                        {
                                            // Same name, same time, different room
                                            _and: [
                                                {
                                                    name: { _eq: data.value.name },
                                                },
                                                {
                                                    scheduledStartTime: { _eq: startTimeStr },
                                                },
                                                {
                                                    scheduledEndTime: {
                                                        _eq: endTimeStr,
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            // Same room, same time, different name
                                            _and: [
                                                {
                                                    roomId: { _eq: data.value.roomId },
                                                },
                                                {
                                                    scheduledStartTime: { _eq: startTimeStr },
                                                },
                                                {
                                                    scheduledEndTime: {
                                                        _eq: endTimeStr,
                                                    },
                                                },
                                            ],
                                        },
                                        // Or overlapping events
                                        {
                                            _and: [
                                                {
                                                    roomId: { _eq: data.value.roomId },
                                                },
                                                {
                                                    scheduledStartTime: {
                                                        _lt: endTimeStr,
                                                    },
                                                },
                                                {
                                                    scheduledEndTime: {
                                                        _gt: startTimeStr,
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            }
                        )
                        .toPromise();
                    if (response?.error) {
                        throw response.error;
                    }
                    const allExisting = response?.data?.existing;
                    if (allExisting?.length) {
                        const scheduledStartTimeMs = new Date(data.value.scheduledStartTime).getTime();
                        const endTimeMs = new Date(endTimeStr).getTime();

                        const matching = allExisting.find(
                            (existing) =>
                                (existing.name === data.value.name || existing.name === data.value.roomId) &&
                                new Date(existing.scheduledStartTime).getTime() === scheduledStartTimeMs &&
                                new Date(existing.scheduledEndTime!).getTime() === endTimeMs
                        );
                        if (matching) {
                            if (
                                matching.enableRecording === data.value.enableRecording &&
                                matching.exhibitionId === data.value.exhibitionId &&
                                matching.modeName === data.value.modeName &&
                                matching.itemId === data.value.itemId &&
                                matching.name === data.value.name &&
                                matching.roomId === data.value.roomId &&
                                matching.shufflePeriodId === data.value.shufflePeriodId &&
                                Date.parse(matching.scheduledStartTime) === Date.parse(data.value.scheduledStartTime) &&
                                Date.parse(matching.scheduledEndTime) === Date.parse(data.value.scheduledEndTime)
                            ) {
                                return {
                                    state: "exists_update_not_required",
                                    value: matching,
                                };
                            } else {
                                return {
                                    state: "exists_update_required",
                                    data: {
                                        outputs: data.outputs,
                                        remapColumns: data.remapColumns,
                                        type: data.type,
                                        value: matching,
                                    },
                                };
                            }
                            // Any remaining events must be overlapping ones
                        } else if (allExisting.length > 0) {
                            throw new Error("Events would overlap!");
                        }
                    }
                } else {
                    const sessionEventId = data.value.sessionEventId;
                    const response = await gqlClient
                        ?.query<ExistingSchedule_EventQuery, ExistingSchedule_EventQueryVariables>(
                            ExistingSchedule_EventDocument,
                            {
                                where: {
                                    conferenceId: { _eq: data.value.conferenceId },
                                    subconferenceId: data.value.subconferenceId
                                        ? { _eq: data.value.subconferenceId }
                                        : { _is_null: true },
                                    sessionEventId: sessionEventId ? { _eq: sessionEventId } : { _is_null: true },

                                    // Same name, also unscheduled and same room
                                    name: { _eq: data.value.name },
                                    scheduledStartTime: { _is_null: true },
                                    roomId: { _eq: data.value.roomId },
                                },
                            }
                        )
                        .toPromise();
                    if (response?.error) {
                        throw response.error;
                    }
                    const allExisting = response?.data?.existing;
                    if (allExisting?.length) {
                        const matching = allExisting[0];
                        if (
                            matching.enableRecording === data.value.enableRecording &&
                            matching.exhibitionId === data.value.exhibitionId &&
                            matching.modeName === data.value.modeName &&
                            matching.itemId === data.value.itemId &&
                            matching.name === data.value.name &&
                            matching.roomId === data.value.roomId &&
                            matching.shufflePeriodId === data.value.shufflePeriodId
                        ) {
                            return {
                                state: "exists_update_not_required",
                                value: matching,
                            };
                        } else {
                            return {
                                state: "exists_update_required",
                                data: {
                                    outputs: data.outputs,
                                    remapColumns: data.remapColumns,
                                    type: data.type,
                                    value: matching,
                                },
                            };
                        }
                    }
                }
            }
            break;
        case "Continutation":
            throw new Error("Not implemented");
        case "EventProgramPerson":
            {
                const response = await gqlClient
                    ?.query<
                        ExistingSchedule_EventProgramPersonQuery,
                        ExistingSchedule_EventProgramPersonQueryVariables
                    >(ExistingSchedule_EventProgramPersonDocument, {
                        where: {
                            eventId: { _eq: data.value.eventId },
                            personId: { _eq: data.value.personId },
                        },
                    })
                    .toPromise();
                if (response?.error) {
                    throw response.error;
                }
                const allExisting = response?.data?.existing;
                if (allExisting?.length) {
                    const matching = allExisting.find((existing) => existing.roleName === data.value.roleName);
                    if (matching) {
                        return {
                            state: "exists_update_not_required",
                            value: matching,
                        };
                    } else if (allExisting.length === 1) {
                        return {
                            state: "exists_update_required",
                            data: {
                                outputs: data.outputs,
                                remapColumns: data.remapColumns,
                                type: "EventProgramPerson",
                                value: {
                                    id: allExisting[0].id,
                                    roleName: data.value.roleName,
                                },
                            },
                        };
                    }
                }
            }
            break;
        default:
            throw new Error("Unrecognised table");
    }

    return { state: "does_not_exist" };
}
